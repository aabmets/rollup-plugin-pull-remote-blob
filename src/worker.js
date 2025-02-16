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

import fs from "node:fs";
import fsp from "node:fs/promises";
import { isMainThread, parentPort, workerData } from "node:worker_threads";
import axios from "axios";
import archive from "./archive.js";

async function downloadFile() {
   const { option, details } = workerData;
   try {
      await fsp.mkdir(details.dirPath, { recursive: true });
      const fileStream = fs.createWriteStream(details.filePath);
      const response = await axios.get(option.url, { responseType: "stream" });
      await new Promise((resolve, reject) => {
         response.data.on("data", (chunk) => {
            parentPort.postMessage({ type: "progress", bytes: chunk.length });
         });
         response.data.on("error", (err) => {
            parentPort.postMessage({ type: "error", error: err.message });
            reject(err);
         });
         fileStream.on("error", (err) => {
            parentPort.postMessage({ type: "error", error: err.message });
            reject(err);
         });
         fileStream.on("finish", () => {
            resolve(undefined);
         });
         response.data.pipe(fileStream);
      });
      const result = { type: "done", filesList: [] };
      if (option.decompress) {
         parentPort.postMessage({ type: "decompressing" });
         result.filesList = await archive.decompressArchive(workerData);
      }
      parentPort.postMessage(result);
   } catch (err) {
      parentPort.postMessage({ type: "error", error: err.message });
      throw err;
   }
}

if (!isMainThread && parentPort) {
   await downloadFile();
}
