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

import type * as t from "@types";
import ansis from "ansis";
import * as f from "./progress/formatters.js";

function nothingToDownload(): void {
   const msg =
      "\n Skipping downloading remote blobs, because none have been defined in the plugin config.\n";
   console.info(ansis.yellow(msg));
}

function allFilesExist(): void {
   const msg = "\n Skipping downloading remote blobs, because all files already exist.\n";
   console.info(ansis.cyan(msg));
}

function downloadingRemoteBlobs(): void {
   const msg = "\n Downloading remote blobs...";
   console.info(ansis.blue.bold(msg));
}

function errorsDetected(results: t.WorkerResult[]): void {
   console.error(" Plugin encountered errors while pulling remote blobs:");
   console.error(f.formatErrors(results));
}

function downloadCompleted(): void {
   const msg = " Successfully completed remote blob downloads.\n";
   console.info(ansis.green.bold(msg));
}

export default {
   nothingToDownload,
   allFilesExist,
   downloadingRemoteBlobs,
   errorsDetected,
   downloadCompleted,
};
