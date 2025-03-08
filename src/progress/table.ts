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
import * as f from "./formatters.js";

export function getLabels(mustDownload: t.ProcessorReturn[]): string[] {
   const cfnLength = f.clampedFileNameLength(mustDownload);
   return [
      `  ${"Index – File name".padEnd(cfnLength)}  `,
      "    File size – Progress bar – Percent complete     ",
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
   const color = 8;
   const bar = ansis.fg(color)("│");
   return [
      ansis.fg(color)(uprBorder),
      `${bar}${labels.join(bar)}${bar}`,
      ansis.fg(color)(btmBorder),
   ].join("\n");
}

export function getTableFooter(mustDownload: t.ProcessorReturn[]): string {
   const labels = getLabels(mustDownload);
   let border = "└[a]┴[b]┴[c]┴[d]┴[e]┘";
   for (const [index, char] of [..."abcde"].entries()) {
      const line = "─".repeat(labels[index].length);
      border = border.replace(`[${char}]`, line);
   }
   return ansis.fg(8)(border);
}
