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

export async function getRemoteFileSizeBytes(
   option: t.RemoteBlobOption | t.HistoryFileEntry,
): Promise<number | null> {
   if ("sizeBytes" in option) {
      let out = option.sizeBytes;
      if (option.sizeBytes instanceof Function) {
         out = option.sizeBytes();
      }
      try {
         return Number(out);
      } catch {
         return null;
      }
   }
   const resp: AxiosResponse = await axios.head(option.url);
   if ("content-length" in resp.headers) {
      return Number(resp.headers["content-length"]);
   }
   return null;
}
