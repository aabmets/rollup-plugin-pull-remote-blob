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

export const workerFilePath = "dist/worker.js";

export const historyFileName = "historical_entries.json";

export const historyFilePath: string = (() => {
   const filename = url.fileURLToPath(import.meta.url);
   const dirname = path.dirname(filename);
   return path.resolve(dirname, historyFileName);
})();

export const defaultPluginConfig: t.PluginConfig = { blobs: [], showProgress: true };
