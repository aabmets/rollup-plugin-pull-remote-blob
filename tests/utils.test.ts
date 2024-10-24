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
      let digest = utils.digestString("asdfg");
      expect(digest).toEqual("f969fdbe811d8a66010d6f8973246763147a2a0914afc8087839e29b563a5af0");

      digest = utils.digestString("asdfg", 32);
      expect(digest).toEqual("f969fdbe811d8a66010d6f8973246763");

      digest = utils.digestString("asdfg", 8);
      expect(digest).toEqual("f969fdbe");
   });
});
