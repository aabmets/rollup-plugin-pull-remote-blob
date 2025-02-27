/*
 *   MIT License
 *
 *   Copyright (c) 2024, Mattias Aabmets
 *
 *   The contents of this file are subject to the terms and conditions defined in the License.
 *   You may not use, modify, or distribute this file except in compliance with the License.
 *
 *   SPDX-License-Identifier: Apache-2.0
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
   const msg = "\n Downloading remote blobs…";
   console.info(ansis.blue.bold(msg));
}

function allDownloadsFailed(results: t.WorkerResult[]): void {
   const msg = " Failed to download all remote blobs:";
   console.error(ansis.red.bold(msg));
   console.error(f.formatErrors(results));
}

function someDownloadsFailed(results: t.WorkerResult[]): void {
   const msg = " Failed to download some remote blobs:";
   console.info(ansis.yellow.bold(msg));
   console.error(f.formatErrors(results));
}

function allDownloadsComplete(): void {
   const msg = " Successfully completed all remote blob downloads.\n";
   console.info(ansis.green.bold(msg));
}

export default {
   nothingToDownload,
   allFilesExist,
   downloadingRemoteBlobs,
   allDownloadsFailed,
   someDownloadsFailed,
   allDownloadsComplete,
};
