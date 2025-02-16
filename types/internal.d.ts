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
   prettyName?: string;
   alwaysPull?: boolean;
   decompress?: boolean | DecompressOptions;
   sizeBytes?: number | (() => Promise<number>);
}

export interface PluginConfig {
   blobs: RemoteBlobOption[];
   showProgress?: boolean;
}

export interface DestDetails {
   fileExists: boolean;
   filePath: string;
   dirExists: boolean;
   dirPath: string;
}

export interface HistoryFileEntry {
   url: string;
   dest: string;
   blobOptionsDigest: string;
   decompression: {
      optionsDigest: string;
      filesList: string[];
   };
}

export interface HistoryFileContents {
   [key: string]: HistoryFileEntry;
}

export interface ProcessorArgs {
   contents: HistoryFileContents;
   option: RemoteBlobOption;
}

export interface ProcessorReturn {
   option: RemoteBlobOption;
   entry: HistoryFileEntry;
   skipDownload: boolean;
}

export interface DownloaderArgs {
   config: PluginConfig;
   procRetArray: ProcessorReturn[];
}
