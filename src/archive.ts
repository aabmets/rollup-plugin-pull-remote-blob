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
import path from "node:path";
import type * as t from "@types";
import decompress from "decompress";
import type { DecompressOptions, File } from "decompress";
import utils from "./utils.js";

function digestDecompressionOptions(options: undefined | boolean | t.DecompressionOptions): string {
   if (typeof options === "boolean") {
      return utils.digestData(options);
   } else if (!options) {
      return "";
   }
   return utils.digestData([
      (options?.filter || "no-filter").toString(),
      (options?.strip || "no-strip").toString(),
   ]);
}

async function allDecompressedFilesExist(entry: t.HistoryFileEntry): Promise<boolean> {
   const details = utils.getDestDetails(entry);
   const filesList = entry.decompression.filesList;
   const results = await Promise.all(
      filesList.map(async (partialFilePath) => {
         const fullFilePath = path.join(details.dirPath, partialFilePath);
         return await fsp.exists(fullFilePath).catch(() => false);
      }),
   );
   return results.every((value) => value === true);
}

async function removeAllDecompressedFiles(entry: t.HistoryFileEntry): Promise<void> {
   const filesList = entry.decompression.filesList;
   if (filesList.length === 0) {
      return;
   }
   const details = utils.getDestDetails(entry);
   const fullFilePathsArray = filesList.map((partialFilePath) => {
      return path.join(details.dirPath, partialFilePath);
   });
   const dirPathsArray = fullFilePathsArray.map((fullFilePath) => {
      return path.dirname(fullFilePath);
   });
   const sortedDirsArray = utils.sortPathsByDepth(dirPathsArray);
   const uniqueDirsArray = [...new Set(sortedDirsArray)];

   await Promise.all(
      fullFilePathsArray.map(async (fullFilePath) => {
         await fsp.unlink(fullFilePath).catch(() => null);
      }),
   );
   await Promise.all(
      uniqueDirsArray.map(async (uniqueDir) => {
         const contents = await fsp.readdir(uniqueDir).catch(() => null);
         if (contents?.length === 0) {
            await fsp.rmdir(uniqueDir).catch(() => null);
         }
      }),
   );
}

async function decompressArchive(args: t.WorkerData): Promise<string[]> {
   const { option, details } = args;
   const opts: Partial<DecompressOptions> = {};
   if (typeof option.decompress === "object") {
      opts.strip = option.decompress.strip;
      const filterPatterns = option.decompress.filter || [];
      if (filterPatterns.length > 0) {
         opts.filter = (file: File) => {
            return filterPatterns.some((pattern) => {
               return new RegExp(pattern).test(file.path);
            });
         };
      }
   }
   const files: File[] = await decompress(details.filePath, details.dirPath, opts);
   await fsp.unlink(details.filePath).catch(() => null);
   return files.map((file) => file.path);
}

export default {
   digestDecompressionOptions,
   allDecompressedFilesExist,
   removeAllDecompressedFiles,
   decompressArchive,
};
