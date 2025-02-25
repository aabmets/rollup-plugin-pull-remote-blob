/*
 *   MIT License
 *
 *   Copyright (c) 2024, Mattias Aabmets
 *
 *   The contents of this file are subject to the terms and conditions defined in the License.
 *   You may not use, modify, or distribute this file except in compliance with the License.
 *
 *   SPDX-License-Identifier: MIT
 */

import fsp from "node:fs/promises";
import { Worker } from "node:worker_threads";
import type * as t from "@types";
import axios, { type AxiosResponse } from "axios";
import * as c from "./constants.js";
import * as b from "./progress/bars.js";
import utils from "./utils.js";

export async function setRemoteFileSizeBytes(option: t.RemoteBlobOption): Promise<void> {
   let value: undefined | number;
   try {
      if ("sizeBytes" in option) {
         value = option.sizeBytes;
      } else {
         const resp: AxiosResponse = await axios.head(option.url);
         if ("content-length" in resp.headers) {
            value = resp.headers["content-length"];
         }
      }
      const valNum = Number(value);
      if (Number.isSafeInteger(valNum)) {
         value = valNum;
      }
   } catch {
      value = undefined;
   }
   option.sizeBytes = value;
}

export async function downloadFiles(args: t.DownloaderArgs): Promise<t.WorkerResult[]> {
   const { config, mustDownload } = args;

   await Promise.all(
      mustDownload.map((procRet) => {
         return setRemoteFileSizeBytes(procRet.option);
      }),
   );

   const { multiBar, progBarMap } = b.getProgressBars(args);
   let errorRaised = false;

   const results: t.WorkerResult[] = await Promise.all(
      mustDownload.map((procRet) => {
         const { option, entry, details } = procRet;

         const absolutePath = utils.searchUpwards(c.workerFilePath);
         const worker = new Worker(absolutePath, { workerData: { option, details } });
         const bar = progBarMap[entry.blobOptionsDigest];

         return new Promise((resolve: (value: t.WorkerResult) => void) => {
            const terminate = (status: t.BarStatus, errorMsg?: string): void => {
               errorRaised = status === c.barStatus.error;
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
            worker.on("message", (message: t.WorkerMessage) => {
               if (message.type === "done") {
                  entry.decompression.filesList = message.filesList;
                  terminate(c.barStatus.done);
               } else if (message.type === "error") {
                  terminate(c.barStatus.error, message.error);
               } else if (config.haltOnError && errorRaised) {
                  terminate(c.barStatus.halted);
               } else if (message.type === "progress") {
                  bar.setStatus(c.barStatus.downloading);
                  bar.increment(message.bytes);
               } else if (message.type === "decompressing") {
                  bar.setStatus(c.barStatus.decompressing);
               }
            });
            worker.on("error", (err: Error) => {
               terminate(c.barStatus.error, err.message);
            });
         });
      }),
   );
   multiBar.stop();

   await Promise.all(
      results
         .filter(({ status }) => status !== c.barStatus.done)
         .map(({ details }) => fsp.unlink(details.filePath)),
   );

   return results;
}
