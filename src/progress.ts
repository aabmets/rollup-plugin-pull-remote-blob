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

const SPINNER_CHARS_1 = [
   "\u2801",
   "\u2809",
   "\u2819",
   "\u281B",
   "\u281E",
   "\u2856",
   "\u28C6",
   "\u28E4",
   "\u28E0",
   "\u28A0",
   "\u2820",
];

const SPINNER_CHARS_2 = [
   "\u2804",
   "\u2844",
   "\u28C4",
   "\u28E4",
   "\u28F0",
   "\u28B2",
   "\u2833",
   "\u281B",
   "\u280B",
   "\u2809",
   "\u2808",
];

export function hilbertSpinner(progress: number, barWidth = 40, numCrawlers = 7): string {
   let offset: number = progress;

   // Each cell takes 8 steps to go through (plus 3 for trailing).
   const cycle = 8 * Math.floor(barWidth / numCrawlers);

   offset %= cycle;

   const spinnerCharsArray: string[] = new Array(barWidth).fill(" ").map((_, idx) => {
      const adjId = -8 * (idx % Math.floor(barWidth / numCrawlers)) + offset;
      const leftOver = -cycle + 8;
      if (idx % 2 === 0) {
         if (adjId >= leftOver && adjId < leftOver + 3) {
            return SPINNER_CHARS_1[cycle + adjId];
         }
         if (adjId < 0 || adjId >= SPINNER_CHARS_1.length) {
            return " ";
         }
         return SPINNER_CHARS_1[adjId];
      } else {
         if (adjId >= leftOver && adjId < leftOver + 3) {
            return SPINNER_CHARS_2[cycle + adjId];
         }
         if (adjId < 0 || adjId >= SPINNER_CHARS_2.length) {
            return " ";
         }
         return SPINNER_CHARS_2[adjId];
      }
   });

   return spinnerCharsArray.join("");
}
