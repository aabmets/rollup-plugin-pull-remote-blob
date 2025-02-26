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
import type cp from "cli-progress";
import * as c from "../constants.js";
import utils from "../utils.js";
import { wormSpinnerGenerator } from "./spinners.js";

export const clampedFileNameLength = utils.memoize((mustDownload: t.ProcessorReturn[]): number => {
   const longestLength = mustDownload.reduce((max, procRet) => {
      const { option, details } = procRet;
      const fileName = option.prettyName || details.fileName;
      return Math.max(max, fileName.length);
   }, 0);
   const lowerClamp = Math.max(longestLength, c.fileNameMinDisplayLength);
   return Math.min(lowerClamp, c.fileNameMaxDisplayLength);
});

export function formatFileName(mustDownload: t.ProcessorReturn[], index: number): string {
   const { option, details } = mustDownload[index];
   const cfnLength = clampedFileNameLength(mustDownload);
   let fileName = option.prettyName || details.fileName;
   fileName = fileName.padEnd(c.fileNameMinDisplayLength);
   fileName = fileName.padEnd(cfnLength);
   if (fileName.length > cfnLength) {
      fileName = fileName.substring(0, cfnLength - 1);
      fileName += "…";
   }
   const extraPadding = mustDownload.length >= 10 ? 2 : 1;
   const fmtIndex = `${index + 1}`.padStart(extraPadding);
   return `${fmtIndex}) ${fileName}`;
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
         const match = fileName.match(/\s?\S+\s/);
         const msgPad = " ".repeat(match ? match[0].length : 0);
         const errMsg = errorMsg ? errorMsg : ansis.italic("Unknown error");
         messages.push(` ${fileName.trimEnd()}:\n ${msgPad}► ${errMsg}`);
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

export function getWormSpinnerBarFormatter(): cp.BarFormatter {
   const spinner = wormSpinnerGenerator();
   return (progress, options) => {
      const count = options?.barsize || c.progressBarWidth;
      let char = "?";
      if ([1, 2].includes(progress)) {
         if (progress === 1) {
            char = options?.barIncompleteChar || "—";
            return ansis.fg(8)(char.repeat(count));
         } else {
            char = options?.barCompleteChar || "■";
            return char.repeat(count);
         }
      }
      return spinner.next().value || char.repeat(count);
   };
}
