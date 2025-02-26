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
import cp from "cli-progress";
import * as c from "../constants";
import * as f from "./formatters.js";
import * as tbl from "./table.js";

export function getDisabledController(fileName: string): t.BarController {
   return {
      fileName,
      setStatus: () => null,
      increment: () => null,
      stop: () => null,
   };
}

export function getBarPayload(fileName: string, sizeBytes?: number) {
   return {
      unknownPct: sizeBytes ? undefined : "  ?",
      fileSize: f.formatFileSize(sizeBytes),
      status: f.formatStatus(c.barStatus.waiting),
      fileName,
   };
}

export function getBarOptions(sizeBytes?: number): cp.Options {
   return {
      format: f.getBarFormat(sizeBytes),
      formatBar: sizeBytes ? undefined : f.getWormSpinnerBarFormatter(),
      formatTime: (t: number, options: cp.Options, roundToMultipleOf: number) => {
         const fmtTime = cp.Format.TimeFormat(t, options, roundToMultipleOf);
         return fmtTime.padStart(7, " ");
      },
      barGlue: sizeBytes ? "\x1B[90m" : undefined,
   };
}

export function getBarController(args: t.SingleBarArgs): t.BarController {
   const { fileName, sizeBytes, showProgress, multiBar } = args;
   if (!showProgress) {
      return getDisabledController(fileName);
   }
   const bar: cp.SingleBar = multiBar.create(
      sizeBytes ?? 0,
      sizeBytes ? 0 : -1,
      getBarPayload(fileName, sizeBytes),
      getBarOptions(sizeBytes),
   );
   let unknownSizeBytes = 0;
   let errorRaised = false;
   return {
      fileName,
      setStatus: (status: t.BarStatus) => {
         errorRaised = status === c.barStatus.error;
         bar.update({ status: f.formatStatus(status) });
      },
      increment: (amount: number) => {
         if (sizeBytes) {
            bar.increment(amount);
         } else {
            unknownSizeBytes += amount;
         }
      },
      stop: () => {
         if (!sizeBytes) {
            bar.update(errorRaised ? 1 : 2, {
               fileSize: f.formatFileSize(unknownSizeBytes),
               unknownPct: errorRaised ? "  0" : 100,
            });
         }
         bar.stop();
      },
   };
}

export function getProgressBars(args: t.DownloaderArgs): t.ProgressBarsReturn {
   const { config, mustDownload } = args;
   const progBarMap: t.ProgressBarMap = {};
   const multiBar = new cp.MultiBar({
      barsize: c.progressBarWidth,
      clearOnComplete: false,
      barCompleteChar: "■",
      barIncompleteChar: "—",
      autopadding: true,
      hideCursor: true,
   });

   if (config.showProgress) {
      const header = tbl.getTableHeader(mustDownload);
      multiBar.create(0, 0, {}, { format: header });
   }

   mustDownload.forEach((procRet: t.ProcessorReturn, index: number) => {
      const { option, entry } = procRet;
      progBarMap[entry.blobOptionsDigest] = getBarController({
         fileName: f.formatFileName(mustDownload, index),
         sizeBytes: option.sizeBytes,
         showProgress: config.showProgress,
         multiBar,
      });
   });

   if (config.showProgress) {
      const footer = tbl.getTableFooter(mustDownload);
      multiBar.create(0, 0, {}, { format: footer });
   }

   return { multiBar, progBarMap };
}
