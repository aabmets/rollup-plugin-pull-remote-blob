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

import path from "node:path";
import {
   array,
   boolean,
   integer,
   object,
   optional,
   refine,
   regexp,
   size,
   string,
   union,
} from "superstruct";
import validator from "validator";
import * as c from "./constants.js";
import utils from "./utils.js";

export const DecompressionOptionsStruct = object({
   filter: optional(array(union([regexp(), string()]))),
   strip: optional(size(integer(), 0, 100)),
});

export const RemoteBlobOptionStruct = object({
   url: refine(string(), "url", (value: string) => {
      const errMsg = `URL does not pass regex pattern validation: ${value}`;
      return validator.isURL(`${value}`) || errMsg;
   }),
   dest: size(string(), 3, 1000),
   sizeBytes: optional(size(integer(), 0, 2 ** 40)),
   prettyName: optional(size(string(), c.prettyNameMinLength, c.prettyNameMaxLength)),
   alwaysPull: optional(boolean()),
   decompress: optional(union([boolean(), DecompressionOptionsStruct])),
});

export const PluginConfigStruct = object({
   blobs: refine(array(RemoteBlobOptionStruct), "constraints", (blobs) => {
      const rboDigests: string[] = [];
      for (const option of blobs) {
         if (path.extname(option.dest) !== "" && !!option.decompress) {
            return `Destination must be a directory when decompressing: '${option.dest}'`;
         }
         const digest = utils.digestRemoteBlobOption(option);
         if (rboDigests.includes(digest)) {
            return `Duplicate entry: ${option.url} -> ${option.dest}`;
         } else {
            rboDigests.push(digest);
         }
      }
      return true;
   }),
   showProgress: optional(boolean()),
   haltOnError: optional(boolean()),
   rollupHook: optional(
      refine(string(), "valid_hooks", (hook) => {
         const hooksArray = ["buildStart", "buildEnd", "writeBundle", "closeBundle"];
         return hooksArray.includes(hook) ? true : `Unsupported rollup hook: '${hook}'`;
      }),
   ),
});
