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

import type { DecompressOptions } from "decompress";

export interface RemoteBlobOption {
   url: string;
   dest: string;
   alwaysPull?: boolean;
   decompress?: boolean | DecompressOptions;
   sizeBytes?: (() => number) | number;
}

export interface PluginConfig {
   blobs: RemoteBlobOption[];
   verbose?: boolean;
}

export interface HistoryFileEntry {
   url: string;
   dest: string;
   decompressedFiles?: string[];
   decompressOptionsDigest?: string;
}

export interface BlobProcessorArgs {
   option: RemoteBlobOption;
   oldEntry?: HistoryFileEntry;
}

export interface HistoryFileContents {
   [key: string]: HistoryFileEntry;
}

export interface DestDetails {
   fileExists: boolean;
   filePath: string;
   dirExists: boolean;
   dirPath: string;
   isFile: boolean;
}
