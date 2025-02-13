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

import {
   any,
   array,
   boolean,
   func,
   min,
   number,
   object,
   optional,
   refine,
   string,
   union,
} from "superstruct";
import validator from "validator";

const DecompressOptionsStruct = object({
   filter: optional(func()),
   map: optional(func()),
   plugins: optional(array(any())),
   strip: optional(min(number(), 0)),
});

const RemoteBlobOptionStruct = object({
   url: refine(string(), "url", (value: string) => {
      const errMsg = `URL does not pass regex pattern validation: ${value}`;
      return validator.isURL(`${value}`) || errMsg;
   }),
   dest: string(),
   alwaysPull: optional(boolean()),
   decompress: optional(union([boolean(), DecompressOptionsStruct])),
   sizeBytes: optional(union([number(), func()])),
});

const PluginConfigStruct = object({
   blobs: array(RemoteBlobOptionStruct),
   verbose: optional(boolean()),
});

export default { PluginConfigStruct };
