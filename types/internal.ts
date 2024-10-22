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

interface RemoteBlobOption {
   url: string;
   dest: string;
   alwaysPull?: boolean;
   decompress?: boolean | DecompressOptions;
}

interface HistoryFileEntry {
   url: string;
   dest: string;
   decompressedFiles?: string[];
}

interface HistoryFileContents {
   [key: string]: HistoryFileEntry;
}

interface DestDetails {
   fileExists: boolean;
   filePath: string;
   dirPath: string;
   isFile: boolean;
}

export type { RemoteBlobOption, HistoryFileEntry, HistoryFileContents, DestDetails };
