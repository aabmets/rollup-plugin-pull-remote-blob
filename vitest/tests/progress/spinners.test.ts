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

import * as c from "@src/constants";
import { wormSpinnerGenerator } from "@src/progress/spinners";
import { describe, expect, it } from "vitest";

describe("wormSpinnerGenerator", () => {
   it("should generate crawling progress bar", () => {
      const spinner = wormSpinnerGenerator();

      const bar1 = spinner.next().value;
      expect(typeof bar1).toEqual("string");
      expect(bar1?.length).toEqual(c.progressBarWidth);

      const bar2 = spinner.next().value;
      expect(typeof bar2).toEqual("string");
      expect(bar2?.length).toEqual(c.progressBarWidth);

      expect(bar1 === bar2).toEqual(false);
   });
});
