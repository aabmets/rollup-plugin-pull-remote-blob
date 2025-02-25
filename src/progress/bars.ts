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

export function getSingleBar(args: t.SingleBarArgs): t.BarController {
   const { fileName, sizeBytes, multiBar } = args;
   const total = sizeBytes ?? 0;
   const start = sizeBytes ? 0 : -1;
   const payload = {
      unknownPct: sizeBytes ? undefined : "  ?",
      fileSize: f.formatFileSize(sizeBytes),
      status: f.formatStatus(c.barStatus.waiting),
      fileName,
   };
   const options: cp.Options = {
      format: f.getBarFormat(sizeBytes),
      formatBar: sizeBytes ? undefined : f.getWormSpinnerBarFormatter(),
      formatTime: (t: number, options: cp.Options, roundToMultipleOf: number) => {
         const fmtTime = cp.Format.TimeFormat(t, options, roundToMultipleOf);
         return fmtTime.padStart(7, " ");
      },
      barGlue: sizeBytes ? "\x1B[90m" : undefined,
   };
   const bar = multiBar.create(total, start, payload, options);
   let unknownSizeBytes = 0;
   return {
      isActive: bar.isActive,
      setStatus: (status: t.BarStatus) => {
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
            bar.update(1, {
               fileSize: f.formatFileSize(unknownSizeBytes),
               unknownPct: 100,
            });
         }
         bar.stop();
      },
      bar,
   };
}

export function getProgressBars(mustDownload: t.ProcessorReturn[]): t.ProgressBarsReturn {
   const progBarMap: t.ProgressBarMap = {};
   const multiBar = new cp.MultiBar({
      barsize: c.progressBarWidth,
      clearOnComplete: false,
      barCompleteChar: "■",
      barIncompleteChar: "—",
      autopadding: true,
      hideCursor: true,
   });

   const header = tbl.getTableHeader(mustDownload);
   multiBar.create(0, 0, {}, { format: header });

   mustDownload.forEach((procRet: t.ProcessorReturn, index: number) => {
      const { option, entry } = procRet;
      progBarMap[entry.blobOptionsDigest] = getSingleBar({
         fileName: f.formatFileName(mustDownload, index),
         sizeBytes: option.sizeBytes,
         multiBar,
      });
   });

   const footer = tbl.getTableFooter(mustDownload);
   multiBar.create(0, 0, {}, { format: footer });

   return { multiBar, progBarMap };
}
