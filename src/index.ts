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
import type { DecompressOptions } from "decompress";
import decompress from "decompress";
import type { Plugin } from "rollup";

interface PullRemoteBlobOption {
   url: string;
   dest: string;
   alwaysPull?: boolean;
   decompress?: DecompressOptions | boolean;
}

interface DestMeta {
   filePath: string;
   dirPath: string;
   isFile: boolean;
   exists: boolean;
}

const HISTORY_FILE_PATH = path.resolve(__dirname, "history.json");

function readHistory(): PullRemoteBlobOption[] {
   if (fs.existsSync(HISTORY_FILE_PATH)) {
      const historyData = fs.readFileSync(HISTORY_FILE_PATH, "utf8");
      return historyData ? JSON.parse(historyData) : [];
   }
   return [];
}

function writeHistory(options: PullRemoteBlobOption[]): void {
   fs.mkdirSync(path.dirname(HISTORY_FILE_PATH), { recursive: true });
   fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(options, null, 2));
}

function getDestMeta(option: PullRemoteBlobOption): DestMeta {
   const destPath = path.resolve(option.dest);
   const isFile = path.extname(destPath) !== "";
   const dirPath = isFile ? path.dirname(destPath) : destPath;
   const fileName = isFile ? path.basename(destPath) : path.basename(option.url);
   const filePath = path.join(dirPath, fileName);
   const exists = fs.existsSync(filePath);
   return { filePath, dirPath, isFile, exists };
}

async function buildStartHandler(options?: PullRemoteBlobOption[]) {
   if (!Array.isArray(options)) {
      return;
   }
   const history = readHistory();
   const pullPromises = options.map(async (option) => {
      if (typeof option !== "object") {
         return;
      }
      const dest: DestMeta = getDestMeta(option);

      const filter = (opt: PullRemoteBlobOption) =>
         opt.url === option.url && dest.exists && !option.alwaysPull;
      if (history.some(filter)) {
         return;
      }
      await fsp.mkdir(dest.dirPath, { recursive: true });
      const response = await axios.get(option.url, { responseType: "arraybuffer" });
      await fsp.writeFile(dest.filePath, response.data);

      if (option.decompress) {
         const decOpt = typeof option.decompress === "object" ? option.decompress : {};
         await decompress(dest.filePath, dest.dirPath, decOpt);
         await fsp.unlink(dest.filePath);
      }
   });
   await Promise.all(pullPromises);
   writeHistory(options);
}

export default function pullRemoteBlobPlugin(options?: PullRemoteBlobOption[]): Plugin {
   return {
      name: "pull-remote-blob",
      buildStart: () => buildStartHandler(options),
   };
}
