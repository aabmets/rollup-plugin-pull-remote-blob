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

import type * as t from "@types";
import axios, { type AxiosResponse } from "axios";

export async function getRemoteFileSizeBytes(option: t.RemoteBlobOption): Promise<number | null> {
   let out: unknown = null;
   try {
      if ("sizeBytes" in option) {
         if (option.sizeBytes instanceof Function) {
            out = await option.sizeBytes();
         } else {
            out = option.sizeBytes;
         }
      } else {
         const resp: AxiosResponse = await axios.head(option.url);
         if ("content-length" in resp.headers) {
            out = resp.headers["content-length"];
         }
      }
      const outNum = Number(out);
      if (Number.isSafeInteger(outNum) && outNum > 0) {
         return outNum;
      }
   } catch {
      return null;
   }
   return null;
}
