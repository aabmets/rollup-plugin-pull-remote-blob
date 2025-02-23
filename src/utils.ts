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
import url from "node:url";
import type * as t from "@types";
import * as c from "./constants.js";

export function searchUpwards(forPath: string, startFrom = import.meta.url): string {
   const startPath = startFrom.startsWith("file://") ? url.fileURLToPath(startFrom) : startFrom;
   let currentDir = path.dirname(startPath);
   while (true) {
      const possiblePath = path.resolve(currentDir, forPath);
      if (fs.existsSync(possiblePath)) {
         return possiblePath;
      }
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
         break;
      }
      currentDir = parentDir;
   }
   throw new Error(`Could not find path: '${forPath}'`);
}

function sortPathsByDepth(paths: string[], sep = path.sep) {
   return paths.sort((a: string, b: string) => {
      const depthA = a.split(sep).length;
      const depthB = b.split(sep).length;
      return depthB - depthA;
   });
}

function digestData(data: any): string {
   const hashInput = JSON.stringify(data) || "";
   const hash = crypto.createHash("sha256");
   const digest = hash.update(hashInput).digest("hex");
   return digest.substring(0, 64);
}

function digestRemoteBlobOption(data: t.UrlDest): string {
   return digestData([data.url, data.dest]);
}

function getDestDetails(data: t.UrlDest): t.DestDetails {
   const destPath = path.resolve(data.dest);
   const isFile = path.extname(destPath) !== "";
   const dirPath = isFile ? path.dirname(destPath) : destPath;
   const fileName = path.basename(isFile ? destPath : data.url);
   const filePath = path.join(dirPath, fileName);
   const fileExists = fs.existsSync(filePath);
   const dirExists = fs.existsSync(dirPath);
   return { fileName, fileExists, filePath, dirExists, dirPath };
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
   searchUpwards,
   sortPathsByDepth,
   digestData,
   digestRemoteBlobOption,
   getDestDetails,
   readHistoryFile,
   writeHistoryFile,
};
