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
import path from "node:path";
import decompress, { type DecompressOptions, type File } from "decompress";
import type { DestDetails, HistoryFileEntry, RemoteBlobOption } from "../types/internal";
import utils from "./utils.js";

function digestDecompressOptions(options: boolean | DecompressOptions): string {
   if (typeof options === "boolean") {
      return utils.digestString(options.toString());
   }
   return utils.digestString(
      [
         `${options?.filter}`,
         `${options?.map}`,
         `${options?.plugins?.length}`,
         `${options?.strip}`,
      ].join(""),
   );
}

function allDecompressedFilesExist(entry: HistoryFileEntry): boolean {
   const details = utils.getDestDetails(entry);
   for (const partialFilePath of entry?.decompressedFiles || []) {
      const fullFilePath = path.join(details.dirPath, partialFilePath);
      if (!fs.existsSync(fullFilePath)) {
         return false;
      }
   }
   return true;
}

async function removeAllDecompressedFiles(entry: HistoryFileEntry): Promise<void> {
   if (!entry?.decompressedFiles) {
      return;
   }
   async function unlinkFile(filePath: string) {
      await fsp.unlink(filePath).catch((_) => null);
   }
   const dest = utils.getDestDetails(entry);
   const fullFilePaths: string[] = entry.decompressedFiles.map((pfp) =>
      path.join(dest.dirPath, pfp),
   );
   await Promise.all(fullFilePaths.map((ffp) => unlinkFile(ffp)));
   const dirPaths = fullFilePaths.map((ffp) => path.dirname(ffp));
   const sortedDirs = utils.sortPathsByDepth(dirPaths);
   [...new Set(sortedDirs)].map((sud) => {
      if (fs.readdirSync(sud).length === 0) {
         fs.rmdirSync(sud);
      }
   });
}

async function decompressArchive(option: RemoteBlobOption, dest: DestDetails): Promise<string[]> {
   const decOpt = typeof option.decompress === "object" ? option.decompress : {};
   const files: File[] = await decompress(dest.filePath, dest.dirPath, decOpt);
   await fsp.unlink(dest.filePath);
   return files.map((file) => file.path);
}

export default {
   digestDecompressOptions,
   allDecompressedFilesExist,
   removeAllDecompressedFiles,
   decompressArchive,
};
