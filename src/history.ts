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
import path from "node:path";
import type { HistoryFileContents, HistoryFileEntry } from "../types/internal";
import utils from "./utils";

const FILE_PATH = path.resolve(__dirname, "historical_entries.json");

function fileContentsFromEntries(entries: HistoryFileEntry[]): HistoryFileContents {
   const data: HistoryFileContents = {};
   entries.forEach((entry) => {
      data[utils.digestString(entry.url, 32)] = entry;
   });
   return data;
}

export function readFile(): HistoryFileContents {
   if (fs.existsSync(FILE_PATH)) {
      const historyData = fs.readFileSync(FILE_PATH, "utf8");
      return historyData ? JSON.parse(historyData) : {};
   }
   return {};
}

function writeFile(entries: HistoryFileEntry[]): void {
   const data = fileContentsFromEntries(entries);
   fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
   fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

export default {
   FILE_PATH,
   fileContentsFromEntries,
   readFile,
   writeFile,
};
