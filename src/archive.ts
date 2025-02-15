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

function digestRemoteBlobOption(
   option: t.RemoteBlobOption,
   dcmpOptDigest: string,
   index: number,
): string {
   return utils.digestString(
      [
         option.url,
         option.dest,
         option.prettyName,
         !!option.alwaysPull,
         (option.sizeBytes || "").toString(),
         dcmpOptDigest,
         index,
      ].join(),
   );
}

function digestDecompressOptions(options: undefined | boolean | DecompressOptions): string {
   if (typeof options === "boolean") {
      return utils.digestString(options.toString());
   } else if (!options) {
      return "";
   }
   return utils.digestString(
      [
         (options?.map || "").toString(),
         (options?.filter || "").toString(),
         (options?.strip || "").toString(),
         (options?.plugins || []).map((plg) => plg.toString()).join(),
      ].join(),
   );
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
   const dest = utils.getDestDetails(entry as t.RemoteBlobOption);
   const fullFilePathsArray = filesList.map((partialFilePath) => {
      return path.join(dest.dirPath, partialFilePath);
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

async function decompressArchive(
   option: t.RemoteBlobOption,
   dest: t.DestDetails,
): Promise<string[]> {
   const dcmpOpt = typeof option.decompress === "object" ? option.decompress : {};
   const files: File[] = await decompress(dest.filePath, dest.dirPath, dcmpOpt);
   await fsp.unlink(dest.filePath).catch(() => null);
   return files.map((file) => file.path);
}

export default {
   digestRemoteBlobOption,
   digestDecompressOptions,
   allDecompressedFilesExist,
   removeAllDecompressedFiles,
   decompressArchive,
};
