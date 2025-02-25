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

import path from "node:path";
import url from "node:url";
import type * as t from "@types";
import ansis from "ansis";

export const parallelDownloads = 4;

export const downloadSpinnerCrawlers = 6;

export const prettyNameMinLength = 5;

export const prettyNameMaxLength = 30;

export const fileNameMinDisplayLength = 13;

export const fileNameMaxDisplayLength = 30;

export const progressBarWidth = 30;

export const workerFilePath = "dist/worker.js";

export const historyFileName = "userData/historical_entries.json";

export const historyFilePath: string = (() => {
   const filename = url.fileURLToPath(import.meta.url);
   const dirname = path.dirname(filename);
   return path.resolve(dirname, historyFileName);
})();

export const defaultPluginConfig: t.PluginConfig = {
   blobs: [],
   showProgress: true,
   haltOnError: true,
};

export const barStatus: t.BarStatusMap = {
   waiting: {
      text: "Waiting",
      colorize: ansis.cyan,
   },
   downloading: {
      text: "Downloading",
      colorize: ansis.blue,
   },
   decompressing: {
      text: "Decompressing",
      colorize: ansis.magenta,
   },
   done: {
      text: "Done",
      colorize: ansis.green,
   },
   error: {
      text: "Error",
      colorize: ansis.red,
   },
   halted: {
      text: "Halted",
      colorize: ansis.yellow,
   },
};

export const maxBarStatusTextLength = Object.values(barStatus).reduce((max, barStatus) => {
   return Math.max(max, barStatus.text.length);
}, 0);
