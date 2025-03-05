/*
 *   MIT License
 *
 *   Copyright (c) 2024, Mattias Aabmets
 *
 *   The contents of this file are subject to the terms and conditions defined in the License.
 *   You may not use, modify, or distribute this file except in compliance with the License.
 *
 *   SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import wrk from "node:worker_threads";
import type * as t from "@types";
import axios from "axios";
import archive from "./archive.js";

const Message = {
   progress: (chunk: Buffer): void => {
      wrk.parentPort?.postMessage({ type: "progress", bytes: chunk.length });
   },
   error: (error: Error): void => {
      wrk.parentPort?.postMessage({ type: "error", error: error.message });
   },
   done: (filesList: string[]): void => {
      wrk.parentPort?.postMessage({ type: "done", filesList });
   },
   decompressing: (): void => {
      wrk.parentPort?.postMessage({ type: "decompressing" });
   },
};

export async function downloadFile() {
   const { option, details } = wrk.workerData as t.WorkerData;
   try {
      await fsp.mkdir(details.dirPath, { recursive: true });
      const fileStream = fs.createWriteStream(details.filePath);
      const response = await axios.get(option.url, { responseType: "stream" });
      await new Promise((resolve, reject) => {
         response.data.on("data", Message.progress);
         response.data.on("error", (err: Error) => {
            Message.error(err);
            reject(err);
         });
         fileStream.on("error", (err: Error) => {
            Message.error(err);
            reject(err);
         });
         fileStream.on("finish", async () => {
            let filesList: string[] = [];
            if (option.decompress) {
               Message.decompressing();
               filesList = await archive.decompressArchive(wrk.workerData);
            }
            Message.done(filesList);
            resolve(undefined);
         });
         response.data.pipe(fileStream);
      });
   } catch (err: any) {
      Message.error(err);
      throw err;
   }
}

/* v8 ignore next 3 */
if (!wrk.isMainThread && wrk.parentPort) {
   await downloadFile();
}
