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
import * as s from "@src/schemas";
import type * as t from "@types";
import { assert } from "superstruct";
import { describe, expect, it } from "vitest";

describe("DecompressionOptionsStruct", () => {
   const assertFunc = (testObj: any) => {
      assert(testObj, s.DecompressionOptionsStruct);
   };

   it("should only allow positive integers for 'strip' field", () => {
      for (const value of [0, 100]) {
         assertFunc({ strip: value });
      }
      for (const value of [-1, 101, 12.3, false, "a", [], {}]) {
         expect(() => assertFunc({ strip: value })).toThrowError();
      }
   });

   it("should only allow an array of strings or RegExp objects for 'filter' field", () => {
      for (const value of [["a"], [/\w/], ["a", /\w/]]) {
         assertFunc({ filter: value });
      }
      for (const value of [-1, 101, 12.3, false, "a", {}]) {
         expect(() => assertFunc({ filter: value })).toThrowError();
      }
      for (const value of [[-1], [101], [12.3], [false], [[]], [{}]]) {
         expect(() => assertFunc({ filter: value })).toThrowError();
      }
   });
});

describe("RemoteBlobOptionStruct", () => {
   const assertFunc = (testObj: any) => {
      const obj = { url: "https://www.example.com", dest: "asd" };
      assert({ ...obj, ...testObj }, s.RemoteBlobOptionStruct);
   };

   it("should only allow strings of valid structure for 'url' field", () => {
      assertFunc({ url: "https://www.example.com/page/file.zip" });
      const invalidUrls = [
         "://www.example.com", // Missing scheme
         "ht tps://www.example.com", // Space in scheme
         "https:///path", // Missing host
         "https://exa mple.com", // Space in host
         "https://exam!ple.com", // Invalid character in host
         "https://www.example.com:abc", // Non-numeric port
         "https://www.example.com:70000", // Port out of range
         "https://www.example.com/pa th", // Unencoded space in path
         "https://www.example.com/path?query=te st", // Unencoded space in query
         "https://www.example.com/path#frag ment", // Unencoded space in fragment
      ];
      for (const value of [-1, 101, 12.3, false, "a", {}, ...invalidUrls]) {
         expect(() => assertFunc({ url: value })).toThrowError();
      }
   });

   it("should only allow valid strings for 'dest' field", () => {
      for (const value of ["abc", "x".repeat(1000)]) {
         assertFunc({ dest: value });
      }
      for (const value of [-1, 101, 12.3, false, {}, "ab", "x".repeat(1001)]) {
         expect(() => assertFunc({ dest: value })).toThrowError();
      }
   });

   it("should only allow positive integers for 'sizeBytes' field", () => {
      for (const value of [0, 2 ** 40]) {
         assertFunc({ sizeBytes: value });
      }
      for (const value of [-1, 12.3, false, "a", [], {}]) {
         expect(() => assertFunc({ sizeBytes: value })).toThrowError();
      }
   });

   it("should only allow strings of specific length for 'prettyName' field", () => {
      for (const count of [c.prettyNameMinLength, c.prettyNameMaxLength]) {
         assertFunc({ prettyName: "x".repeat(count) });
      }
      for (const count of [c.prettyNameMinLength - 1, c.prettyNameMaxLength + 1]) {
         expect(() => assertFunc({ prettyName: "x".repeat(count) })).toThrowError();
      }
      for (const value of [-1, 101, 12.3, false, [], {}]) {
         expect(() => assertFunc({ prettyName: value })).toThrowError();
      }
   });

   it("should only allow boolean values for 'alwaysPull' field", () => {
      for (const value of [true, false]) {
         assertFunc({ alwaysPull: value });
      }
      for (const value of [-1, 101, 12.3, "x", [], {}]) {
         expect(() => assertFunc({ prettyName: value })).toThrowError();
      }
   });

   it("should only allow boolean or valid objects for 'decompress' field", () => {
      for (const value of [true, false, { filter: ["x"], strip: 3 }]) {
         assertFunc({ decompress: value });
      }
      for (const value of [-1, 101, 12.3, "x", []]) {
         expect(() => assertFunc({ decompress: value })).toThrowError();
      }
   });
});

describe("PluginConfigStruct", () => {
   const assertFunc = (testObj: any) => {
      assert({ blobs: [], ...testObj }, s.PluginConfigStruct);
   };

   it("should pass validation of non-duplicate valid blobs", () => {
      assertFunc({
         blobs: [
            {
               url: "https://www.example.com/first_model.onnx",
               dest: "./downloads",
            },
            {
               url: "https://www.example.com/second_model.onnx",
               dest: "./downloads",
            },
         ] as t.RemoteBlobOption[],
      });
   });

   it("should fail validation of duplicate valid blobs", () => {
      expect(() =>
         assertFunc({
            blobs: [
               {
                  url: "https://www.example.com/first_model.onnx",
                  dest: "./downloads",
               },
               {
                  url: "https://www.example.com/first_model.onnx",
                  dest: "./downloads",
               },
            ] as t.RemoteBlobOption[],
         }),
      ).toThrowError();
   });

   it("should fail validation when blob has decompression options and dest is a file", () => {
      expect(() =>
         assertFunc({
            blobs: [
               {
                  url: "https://www.example.com/first_model.onnx",
                  dest: "./downloads/first_model.onnx",
                  decompress: true,
               },
            ] as t.RemoteBlobOption[],
         }),
      ).toThrowError();
   });

   it("should only allow boolean values for 'showProgress' field", () => {
      for (const value of [true, false]) {
         assertFunc({ showProgress: value });
      }
      for (const value of [-1, 101, 12.3, "x", [], {}]) {
         expect(() => assertFunc({ showProgress: value })).toThrowError();
      }
   });

   it("should only allow boolean values for 'haltOnError' field", () => {
      for (const value of [true, false]) {
         assertFunc({ haltOnError: value });
      }
      for (const value of [-1, 101, 12.3, "x", [], {}]) {
         expect(() => assertFunc({ haltOnError: value })).toThrowError();
      }
   });

   it("should only allow valid strings for 'rollupHook' field", () => {
      for (const value of ["buildStart", "buildEnd", "writeBundle", "closeBundle"]) {
         assertFunc({ rollupHook: value });
      }
      for (const value of [-1, 101, 12.3, "x", true, [], {}]) {
         expect(() => assertFunc({ rollupHook: value })).toThrowError();
      }
   });
});
