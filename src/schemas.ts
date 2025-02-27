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
import { array, boolean, min, number, object, optional, refine, string, union } from "superstruct";
import validator from "validator";
import * as c from "./constants.js";
import utils from "./utils.js";

export const DecompressionOptionsStruct = object({
   filter: optional(array(string())),
   strip: optional(min(number(), 0)),
});

export const RemoteBlobOptionStruct = object({
   url: refine(string(), "url", (value: string) => {
      const errMsg = `URL does not pass regex pattern validation: ${value}`;
      return validator.isURL(`${value}`) || errMsg;
   }),
   dest: string(),
   sizeBytes: optional(number()),
   prettyName: optional(string()),
   alwaysPull: optional(boolean()),
   decompress: optional(union([boolean(), DecompressionOptionsStruct])),
});

export const PluginConfigStruct = object({
   blobs: refine(array(RemoteBlobOptionStruct), "constraints", (blobs) => {
      const rboDigests: string[] = [];
      for (const option of blobs) {
         const digest = utils.digestRemoteBlobOption(option);
         if (rboDigests.includes(digest)) {
            return `Duplicate entry: ${option.url} -> ${option.dest}`;
         } else {
            rboDigests.push(digest);
         }
         if (path.extname(option.dest) !== "" && !!option.decompress) {
            return `Destination must be a directory when decompressing: '${option.dest}'`;
         }
         const prettyName = option.prettyName;
         const minLen = c.prettyNameMinLength;
         const maxLen = c.prettyNameMaxLength;
         if (prettyName && prettyName.length < minLen) {
            return `Pretty name '${prettyName}' must be at least ${minLen} characters long.`;
         }
         if (prettyName && prettyName.length > maxLen) {
            return `Pretty name '${prettyName}' must not exceed ${maxLen} characters in length.`;
         }
      }
      return true;
   }),
   showProgress: optional(boolean()),
   haltOnError: optional(boolean()),
});
