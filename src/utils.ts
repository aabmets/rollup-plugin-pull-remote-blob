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

import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import type { HistoryFileEntry, RemoteBlobOption } from "../types/internal";
import type { DestDetails } from "../types/internal";

function sortPathsByDepth(paths: string[], sep = path.sep) {
   return paths.sort((a: string, b: string) => {
      const depthA = a.split(sep).length;
      const depthB = b.split(sep).length;
      return depthB - depthA;
   });
}

function digestString(data: string, outputSize = 64): string {
   const hash = crypto.createHash("sha256");
   const digest = hash.update(data).digest("hex");
   return digest.substring(0, outputSize);
}

function getDestDetails(srcObj: RemoteBlobOption | HistoryFileEntry): DestDetails {
   if (path.extname(srcObj.dest) !== "" && "decompress" in srcObj && srcObj?.decompress) {
      throw new Error(`Destination must be a directory when decompressing: '${srcObj.dest}'`);
   }
   const destPath = path.resolve(srcObj.dest);
   const isFile = path.extname(destPath) !== "";
   const dirPath = isFile ? path.dirname(destPath) : destPath;
   const fileName = isFile ? path.basename(destPath) : path.basename(srcObj.url);
   const filePath = path.join(dirPath, fileName);
   const fileExists = fs.existsSync(filePath);
   const dirExists = fs.existsSync(dirPath);
   return { fileExists, filePath, dirExists, dirPath, isFile };
}

async function downloadFile(option: RemoteBlobOption, dest: DestDetails): Promise<void> {
   await fsp.mkdir(dest.dirPath, { recursive: true });
   const response = await axios.get(option.url, { responseType: "arraybuffer" });
   await fsp.writeFile(dest.filePath, response.data);
}

export default { sortPathsByDepth, digestString, getDestDetails, downloadFile };
