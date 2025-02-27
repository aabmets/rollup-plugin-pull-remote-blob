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

import type cp from "cli-progress";
import type { Plugin } from "rollup";

export interface UrlDest {
   url: string;
   dest: string;
   [key: string]: any;
}

export interface DecompressionOptions {
   filter?: string[];
   strip?: number;
}

export interface RemoteBlobOption {
   url: string;
   dest: string;
   sizeBytes?: number;
   prettyName?: string;
   alwaysPull?: boolean;
   decompress?: boolean | DecompressionOptions;
}

export interface PluginConfig {
   blobs: RemoteBlobOption[];
   showProgress?: boolean;
   haltOnError?: boolean;
}

export type CustomPlugin = Plugin & { buildStart: () => Promise<void> };

export interface DestDetails {
   fileName: string;
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
   details: DestDetails;
   skipDownload: boolean;
   errorMsg?: string;
}

export interface DownloaderArgs {
   config: PluginConfig;
   mustDownload: ProcessorReturn[];
}

export interface WorkerData {
   option: RemoteBlobOption;
   details: DestDetails;
}

export interface WorkerResult {
   fileName: string;
   errorMsg?: string;
   details: DestDetails;
   status: BarStatus;
}

export type WorkerMessage =
   | { type: "progress"; bytes: number }
   | { type: "error"; error: string }
   | { type: "done"; filesList: string[] }
   | { type: "decompressing" };

export interface ControllerArgs {
   fileName: string;
   sizeBytes: number | undefined;
   showProgress?: boolean;
   multiBar: cp.MultiBar;
}

export interface BarController {
   fileName: string;
   isError: () => boolean;
   setStatus: (status: any) => void;
   increment: (amount: number) => void;
   stop: () => void;
}

export interface ProgressBarMap {
   [key: string]: BarController;
}

export interface ProgressBarsReturn {
   multiBar: cp.MultiBar;
   progBarMap: ProgressBarMap;
}

export interface BarStatus {
   text: string;
   colorize: (text: string) => string;
}

export interface BarStatusMap {
   waiting: BarStatus;
   downloading: BarStatus;
   decompressing: BarStatus;
   done: BarStatus;
   error: BarStatus;
   halted: BarStatus;
}

export type Error = { isRaised: boolean };

export interface WorkerRunnerArgs {
   config: PluginConfig;
   procRet: ProcessorReturn;
   progBarMap: ProgressBarMap;
   error: Error;
}

export interface MessageHandlerArgs {
   message: WorkerMessage;
   config: PluginConfig;
   entry: HistoryFileEntry;
   error: Error;
   bar: BarController;
   terminate: (status: BarStatus, errorMsg?: string) => void;
}

export type Condition = (errorMsg?: string) => boolean;
export type WorkerResolver = (value: WorkerResult) => void;
export type WorkerTerminator = (status: BarStatus, errorMsg?: string) => void;
