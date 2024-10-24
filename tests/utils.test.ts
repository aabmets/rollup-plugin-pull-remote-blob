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

import { describe, expect, test } from "@jest/globals";
import utils from "../src/utils";

describe("utils", () => {
   test("digestString", () => {
      const digest = utils.digestString("asdfg");
      expect(digest).toEqual("f969fdbe811d8a66010d6f8973246763");
   });
});
