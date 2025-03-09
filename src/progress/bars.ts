/*
 *   Apache License
 *
 *   Copyright (c) 2024, Mattias Aabmets
 *
 *   The contents of this file are subject to the terms and conditions defined in the License.
 *   You may not use, modify, or distribute this file except in compliance with the License.
 *
 *   SPDX-License-Identifier: Apache-2.0
 */

import type * as t from "@types";
import cp from "cli-progress";
import * as c from "../constants";
import * as f from "./formatters.js";
import * as tbl from "./table.js";

export function getBarPayload(fileName: string, sizeBytes?: number): t.BarPayload {
   return {
      unknownPct: sizeBytes ? undefined : "  ?",
      fileSize: f.formatFileSize(sizeBytes),
      status: f.formatStatus(c.barStatus.waiting),
      fileName,
   };
}

export function getBarOptions(barStatus: t.BarStatus[], sizeBytes?: number): cp.Options {
   return {
      format: f.getBarFormat(sizeBytes),
      formatBar: sizeBytes ? undefined : f.getWormSpinnerBarFormatter(barStatus),
      formatTime: (t: number, options: cp.Options, roundToMultipleOf: number) => {
         const fmtTime = cp.Format.TimeFormat(t, options, roundToMultipleOf);
         return fmtTime.padStart(7, " ");
      },
      barGlue: sizeBytes ? "\x1B[90m" : undefined,
   };
}

export function getController(args: t.ControllerArgs): t.BarController {
   const { fileName, sizeBytes, multiBar } = args;
   const barStatus: t.BarStatus[] = [c.barStatus.waiting];
   let receivedSizeBytes = 0;

   const bar: cp.SingleBar = multiBar.create(
      sizeBytes ?? 0,
      sizeBytes ? 0 : -1,
      getBarPayload(fileName, sizeBytes),
      getBarOptions(barStatus, sizeBytes),
   );
   return {
      fileName,
      isError: () => barStatus[0] === c.barStatus.error,
      setStatus: (status: t.BarStatus) => {
         bar.update({ status: f.formatStatus(status) });
         barStatus[0] = status;
      },
      increment: (amount: number) => {
         receivedSizeBytes += amount;
         if (sizeBytes) {
            bar.increment(amount);
         } else {
            const rsbFmt = f.formatFileSize(receivedSizeBytes);
            bar.update({ fileSize: rsbFmt });
         }
      },
      stop: () => {
         if (!sizeBytes) {
            const unknownPct = barStatus[0] === c.barStatus.done ? 100 : "  0";
            const fileSize = f.formatFileSize(receivedSizeBytes);
            bar.update(1, { fileSize, unknownPct });
         }
         bar.stop();
      },
      bar,
   };
}

export function getDisabledController({ fileName }: t.ControllerArgs): t.BarController {
   return {
      fileName,
      isError: () => false,
      setStatus: () => null,
      increment: () => null,
      stop: () => null,
      bar: undefined,
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
      const fileName = f.formatFileName(mustDownload, index);
      const args: t.ControllerArgs = {
         sizeBytes: option.sizeBytes,
         fileName,
         multiBar,
      };
      progBarMap[entry.blobOptionsDigest] = config.showProgress
         ? getController(args)
         : getDisabledController(args);
   });

   if (config.showProgress) {
      const footer = tbl.getTableFooter(mustDownload);
      multiBar.create(0, 0, {}, { format: footer });
   }

   return { multiBar, progBarMap };
}
