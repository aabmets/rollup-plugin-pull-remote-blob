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
import type cp from "cli-progress";
import * as c from "../constants.js";
import utils from "../utils.js";
import { wormSpinnerGenerator } from "./spinners.js";

export function getFileName(procRet: t.ProcessorReturn, index: number): string {
   const { option, details } = procRet;
   const fileName = option.prettyName ?? details.fileName;
   return `${index + 1}) ${fileName}`;
}

export const clampedFileNameLength = utils.memoize((mustDownload: t.ProcessorReturn[]): number => {
   const longestLength = mustDownload.reduce((value, procRet, index) => {
      const fileName = getFileName(procRet, index);
      return Math.max(value, fileName.length);
   }, 0);
   const lowerClamp = Math.max(longestLength, c.fileNameMinDisplayLength);
   return Math.min(lowerClamp, c.fileNameMaxDisplayLength);
});

export function formatFileName(mustDownload: t.ProcessorReturn[], index: number): string {
   const procRet = mustDownload[index];
   const cfnLength = clampedFileNameLength(mustDownload);
   let fileName = getFileName(procRet, index);
   fileName = fileName.padEnd(c.fileNameMinDisplayLength);

   if (fileName.length > c.fileNameMaxDisplayLength) {
      fileName = fileName.substring(0, cfnLength - 1);
      fileName += "…";
   } else {
      fileName = fileName.padEnd(cfnLength);
   }
   return fileName;
}

export function formatFileSize(bytes?: number): string {
   if (bytes === undefined) {
      const paddedNum = "???".padStart(6, " ");
      const paddedUnit = "B".padEnd(3, " ");
      return `${paddedNum} ${paddedUnit}`;
   }

   let value: number;
   let unit: string;
   let numStr: string;

   if (bytes >= 1024 ** 3) {
      value = bytes / 1024 ** 3;
      unit = "GiB";
      numStr = value.toFixed(1);
   } else if (bytes >= 1024 ** 2) {
      value = bytes / 1024 ** 2;
      unit = "MiB";
      numStr = value.toFixed(1);
   } else if (bytes >= 1024) {
      value = bytes / 1024;
      unit = "KiB";
      numStr = value.toFixed(1);
   } else {
      value = bytes;
      unit = "B";
      numStr = value.toString();
   }

   const paddedNum = numStr.padStart(6, " ");
   const paddedUnit = unit.padEnd(3, " ");

   return `${paddedNum} ${paddedUnit}`;
}

export function formatStatus(status: t.BarStatus): string {
   const paddedText = status.text.padEnd(c.maxBarStatusTextLength, " ");
   return status.colorize(paddedText);
}

export function formatErrors(results: t.WorkerResult[]): string {
   const messages: string[] = [];
   results.forEach(({ fileName, errorMsg, status }) => {
      if (status === c.barStatus.error) {
         const match = /^\s{0,2}.{0,3}\s/.exec(fileName);
         const msgPad = " ".repeat(match ? match[0].length : 0);
         const errMsg = errorMsg ?? ansis.italic("Unknown error");
         messages.push(` ${fileName.trimEnd()} error:\n ${msgPad}► ${errMsg}`);
      }
   });
   return messages.join("\n");
}

export function getBarFormat(sizeBytes?: number): string {
   const defaultBar = "{fileSize} [{bar}\x1B[0m] {percentage}%";
   const unknownBar = "{fileSize} [{bar}] {unknownPct}%";
   const bar = ansis.fg(8)("│");
   return [
      `${bar}  {fileName}`,
      sizeBytes ? defaultBar : unknownBar,
      "{eta_formatted}",
      "{duration_formatted}",
      `{status}  ${bar}`,
   ].join(`  ${bar}  `);
}

export function getWormSpinnerBarFormatter(barStatus: t.BarStatus[]): cp.BarFormatter {
   const spinner = wormSpinnerGenerator();
   return (progress, options) => {
      const count = options?.barsize || c.progressBarWidth;
      let char = "?";
      if (progress === 1) {
         if (barStatus[0] === c.barStatus.done) {
            char = options?.barCompleteChar || "■";
            return char.repeat(count);
         } else {
            char = options?.barIncompleteChar || "—";
            return ansis.fg(8)(char.repeat(count));
         }
      }
      return spinner.next().value || char.repeat(count);
   };
}
