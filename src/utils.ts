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
import path from "node:path";
import type * as t from "@types";
import * as c from "./constants.js";

function sortPathsByDepth(paths: string[], sep = path.sep) {
   return paths.sort((a: string, b: string) => {
      const depthA = a.split(sep).length;
      const depthB = b.split(sep).length;
      return depthB - depthA;
   });
}

function digestString(data: string): string {
   const hash = crypto.createHash("sha256");
   const digest = hash.update(data).digest("hex");
   return digest.substring(0, 64);
}

function getDestDetails(option: t.RemoteBlobOption): t.DestDetails {
   const destPath = path.resolve(option.dest);
   const isFile = path.extname(destPath) !== "";
   if (isFile && option?.decompress) {
      throw new Error(`Destination must be a directory when decompressing: '${option.dest}'`);
   }
   const dirPath = isFile ? path.dirname(destPath) : destPath;
   const fileName = path.basename(isFile ? destPath : option.url);
   const filePath = path.join(dirPath, fileName);
   const fileExists = fs.existsSync(filePath);
   const dirExists = fs.existsSync(dirPath);
   return { fileExists, filePath, dirExists, dirPath };
}

function readHistoryFile(): t.HistoryFileContents {
   try {
      if (fs.existsSync(c.historyFilePath)) {
         const historyData = fs.readFileSync(c.historyFilePath, "utf8");
         return historyData ? JSON.parse(historyData) : {};
      }
   } catch {
      return {};
   }
   return {};
}

function writeHistoryFile(entries: t.HistoryFileEntry[]): void {
   const data: t.HistoryFileContents = {};
   entries.forEach((entry) => {
      data[entry.blobOptionsDigest] = entry;
   });
   fs.mkdirSync(path.dirname(c.historyFilePath), { recursive: true });
   fs.writeFileSync(c.historyFilePath, JSON.stringify(data, null, 2));
}

export default {
   sortPathsByDepth,
   digestString,
   getDestDetails,
   readHistoryFile,
   writeHistoryFile,
};
