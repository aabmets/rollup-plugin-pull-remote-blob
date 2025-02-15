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

/**
 * A generator function that produces animated Hilbert-style spinner frames.
 *
 * @param barWidth - The width of the spinner bar.
 * @param numCrawlers - The number of moving elements within the spinner.
 * @yields - The next frame of the spinner animation as a string.
 */
export function* hilbertSpinnerGenerator(
   barWidth = 40,
   numCrawlers = 7,
): Generator<string, void, void> {
   const charSet1 = [
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
   const charSet2 = [
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
   let progress = 0;
   while (true) {
      // Each cell takes 8 steps to go through (plus 3 for trailing).
      const cycle = 8 * Math.floor(barWidth / numCrawlers);

      progress %= cycle;

      const spinnerCharsArray: string[] = new Array(barWidth).fill(" ").map((_, idx) => {
         const adjId = -8 * (idx % Math.floor(barWidth / numCrawlers)) + progress;
         const leftOver = -cycle + 8;
         if (idx % 2 === 0) {
            if (adjId >= leftOver && adjId < leftOver + 3) {
               return charSet1[cycle + adjId];
            }
            if (adjId < 0 || adjId >= charSet1.length) {
               return " ";
            }
            return charSet1[adjId];
         } else {
            if (adjId >= leftOver && adjId < leftOver + 3) {
               return charSet2[cycle + adjId];
            }
            if (adjId < 0 || adjId >= charSet2.length) {
               return " ";
            }
            return charSet2[adjId];
         }
      });

      yield spinnerCharsArray.join("");
      progress++;
   }
}
