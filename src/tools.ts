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
import axios from "axios";
import decompress, { type DecompressOptions, type File } from "decompress";
import type {
   DestDetails,
   HistoryFileContents,
   HistoryFileEntry,
   RemoteBlobOption,
} from "../types/internal";
import utils from "./utils";

const HISTORY_FILE_PATH = path.resolve(__dirname, "history.json");

function getHistoryFileContents(histOpts: HistoryFileEntry[]): HistoryFileContents {
   const data: HistoryFileContents = {};
   histOpts.forEach((opt) => {
      data[utils.digestString(opt.url)] = opt;
   });
   return data;
}

function readHistory(): HistoryFileContents {
   if (fs.existsSync(HISTORY_FILE_PATH)) {
      const historyData = fs.readFileSync(HISTORY_FILE_PATH, "utf8");
      return historyData ? JSON.parse(historyData) : {};
   }
   return {};
}

function writeHistory(histOpts: HistoryFileEntry[]): void {
   const data: HistoryFileContents = getHistoryFileContents(histOpts);
   fs.mkdirSync(path.dirname(HISTORY_FILE_PATH), { recursive: true });
   fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(data, null, 2));
}

function getDestDetails(option: RemoteBlobOption): DestDetails {
   const destPath = path.resolve(option.dest);
   const isFile = path.extname(destPath) !== "";
   const dirPath = isFile ? path.dirname(destPath) : destPath;
   const fileName = isFile ? path.basename(destPath) : path.basename(option.url);
   const filePath = path.join(dirPath, fileName);
   const fileExists = fs.existsSync(filePath);
   return { fileExists, filePath, dirPath, isFile };
}

function allDecompressedFilesExist(histOpt: HistoryFileEntry): boolean {
   for (const fileName of histOpt?.decompressedFiles || []) {
      const filePath = path.join(histOpt.dest, fileName);
      if (!fs.existsSync(filePath)) {
         return false;
      }
   }
   return true;
}

async function downloadAndWriteFile(option: RemoteBlobOption, dest: DestDetails): Promise<void> {
   await fsp.mkdir(dest.dirPath, { recursive: true });
   const response = await axios.get(option.url, { responseType: "arraybuffer" });
   await fsp.writeFile(dest.filePath, response.data);
}

async function decompressArchive(option: RemoteBlobOption, dest: DestDetails): Promise<string[]> {
   const decOpt = typeof option.decompress === "object" ? option.decompress : {};
   const files: File[] = await decompress(dest.filePath, dest.dirPath, decOpt);
   await fsp.unlink(dest.filePath);
   return files.map((file) => file.path);
}

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

export default {
   HISTORY_FILE_PATH,
   getHistoryFileContents,
   readHistory,
   writeHistory,
   getDestDetails,
   allDecompressedFilesExist,
   downloadAndWriteFile,
   decompressArchive,
   digestDecompressOptions,
};
