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
import * as f from "./formatters.js";

function getLabels(mustDownload: t.ProcessorReturn[]): string[] {
   const cfnLength = f.clampedFileNameLength(mustDownload);
   const extraPadding = mustDownload.length >= 10 ? 9 : 8;
   return [
      "  Index – File name  ".padEnd(cfnLength + extraPadding),
      "     File size – Progress bar – Percent complete      ",
      "      ETA  ",
      "  Elapsed  ",
      "  Status         ",
   ];
}

export function getTableHeader(mustDownload: t.ProcessorReturn[]): string {
   const labels = getLabels(mustDownload);
   let uprBorder = "┌[a]┬[b]┬[c]┬[d]┬[e]┐";
   let btmBorder = "├[a]┼[b]┼[c]┼[d]┼[e]┤";

   for (const [index, char] of [..."abcde"].entries()) {
      const line = "─".repeat(labels[index].length);
      uprBorder = uprBorder.replace(`[${char}]`, line);
      btmBorder = btmBorder.replace(`[${char}]`, line);
   }
   return [uprBorder, `│${labels.join("│")}│`, btmBorder].join("\n");
}

export function getTableFooter(mustDownload: t.ProcessorReturn[]): string {
   const labels = getLabels(mustDownload);
   let border = "└[a]┴[b]┴[c]┴[d]┴[e]┘";
   for (const [index, char] of [..."abcde"].entries()) {
      const line = "─".repeat(labels[index].length);
      border = border.replace(`[${char}]`, line);
   }
   return border;
}
