/*
 *   Apache License
 *
 *   Copyright (c) 2024, Mattias Aabmets
 *
 *   The contents of this file are subject to the terms and conditions defined in the License.
 *   You may not use, modify, or distribute this file except in compliance with the License.
 *
 *   SPDX-License-Identifier: Apache-2.0
 */

import fsp from "node:fs/promises";
import { Worker } from "node:worker_threads";
import type * as t from "@types";
import { Semaphore } from "async-mutex";
import axios, { type AxiosResponse } from "axios";
import * as c from "./constants.js";
import * as b from "./progress/bars.js";
import utils from "./utils.js";

export async function setRemoteFileSizeBytes(procRet: t.ProcessorReturn): Promise<void> {
   let value: undefined | number;
   try {
      if ("sizeBytes" in procRet.option) {
         value = procRet.option.sizeBytes;
      } else {
         const resp: AxiosResponse = await axios.head(procRet.option.url);
         if ("content-length" in resp.headers) {
            value = resp.headers["content-length"];
         }
      }
      const valNum = Number(value);
      if (Number.isSafeInteger(valNum)) {
         value = valNum;
      }
   } catch (err: any) {
      procRet.errorMsg = err.message;
      value = undefined;
   }
   procRet.option.sizeBytes = value;
}

export function handleWorkerMessage(args: t.MessageHandlerArgs): void {
   const { message, config, entry, error, bar, terminate } = args;
   if (message.type === "done") {
      entry.decompression.filesList = message.filesList;
      terminate(c.barStatus.done);
   } else if (message.type === "error") {
      terminate(c.barStatus.error, message.error);
   } else if (config.haltOnError && error.isRaised) {
      terminate(c.barStatus.halted);
   } else if (message.type === "progress") {
      bar.setStatus(c.barStatus.downloading);
      bar.increment(message.bytes);
   } else if (message.type === "decompressing") {
      bar.setStatus(c.barStatus.decompressing);
   }
}

export async function runDownloadWorker(args: t.WorkerRunnerArgs): Promise<t.WorkerResult> {
   const { config, procRet, progBarMap, error } = args;
   const { option, entry, details } = procRet;

   const bar = progBarMap[entry.blobOptionsDigest];
   const absolutePath = utils.searchUpwards(c.workerFilePath);
   const worker = new Worker(absolutePath, { workerData: { option, details } });

   function getTerminator(resolve: t.WorkerResolver): t.WorkerTerminator {
      return (status: t.BarStatus, errorMsg?: string): void => {
         error.isRaised = status === c.barStatus.error;
         worker.removeAllListeners();
         worker.terminate().catch(() => null);
         bar.setStatus(status);
         bar.stop();
         const retObj: t.WorkerResult = {
            fileName: bar.fileName,
            errorMsg,
            details,
            status,
         };
         setTimeout(() => resolve(retObj), 100);
      };
   }

   return new Promise((resolve: t.WorkerResolver) => {
      const terminate = getTerminator(resolve);
      worker.on("message", (message: t.WorkerMessage) => {
         handleWorkerMessage({ message, config, entry, error, bar, terminate });
      });
      worker.on("error", (err: Error) => {
         terminate(c.barStatus.error, err.message);
      });
   });
}

export async function downloadFiles(args: t.DownloaderArgs): Promise<t.WorkerResult[]> {
   const { config, mustDownload } = args;
   const results: t.WorkerResult[] = [];
   const error = { isRaised: false };

   // make head requests with axios and set sizeBytes and error state
   await Promise.all(
      mustDownload.map((procRet) => {
         return setRemoteFileSizeBytes(procRet);
      }),
   );

   const { multiBar, progBarMap } = b.getProgressBars(args);

   function pushResultOnCondition(status: t.BarStatus, condition: t.Condition): void {
      mustDownload.forEach((procRet) => {
         const { entry, details, errorMsg } = procRet;
         const bar = progBarMap[entry.blobOptionsDigest];
         if (condition(errorMsg)) {
            bar.setStatus(status);
            bar.stop();
            multiBar.update();
            results.push({
               fileName: bar.fileName,
               errorMsg,
               details,
               status,
            });
         }
      });
   }

   // set download as failed when axios head request has failed
   pushResultOnCondition(c.barStatus.error, (errorMsg) => {
      error.isRaised = errorMsg ? true : error.isRaised;
      return !!errorMsg;
   });

   // conditionally halt other downloads
   pushResultOnCondition(c.barStatus.halted, (errorMsg) => {
      return Boolean(config.haltOnError && error.isRaised && !errorMsg);
   });

   // conditionally return early if errors
   if (config.haltOnError && error.isRaised) {
      multiBar.stop();
      return results;
   }

   // download non-errored remote blobs if should keep going
   const semaphore = new Semaphore(c.parallelDownloads);
   await Promise.all(
      mustDownload
         .filter(({ entry }) => {
            const bar = progBarMap[entry.blobOptionsDigest];
            return !bar.isError();
         })
         .map(async (procRet) => {
            const args = { config, procRet, progBarMap, error };
            await semaphore.runExclusive(async () => {
               const res = await runDownloadWorker(args);
               results.push(res);
            });
         }),
   );
   multiBar.stop();

   // cleanup partially downloaded files
   await Promise.all(
      results
         .filter(({ status }) => status !== c.barStatus.done)
         .map(({ details }) => fsp.unlink(details.filePath)),
   ).catch(() => null);

   return results;
}
