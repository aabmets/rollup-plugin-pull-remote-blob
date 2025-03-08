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
import * as d from "@src/downloader";
import utils from "@src/utils";
import type * as t from "@types";
import { vi } from "vitest";
import { mockLoggers } from "./various.js";

export function setupPluginMainTest(status1: t.BarStatus, status2?: t.BarStatus) {
   const getResult = (status: t.BarStatus) => {
      return {
         fileName: "testFile.txt",
         errorMsg: undefined,
         details: {} as t.DestDetails,
         status,
      };
   };
   const results = [getResult(status1), getResult(status2 ?? status1)];
   vi.spyOn(d, "downloadFiles").mockReturnValue(Promise.resolve(results));
   vi.spyOn(utils, "writeHistoryFile").mockImplementation(() => undefined);
   const blobs: t.RemoteBlobOption[] = [{ url: "https://www.example.com", dest: "download" }];
   const config: t.MergedConfig = { ...c.defaultPluginConfig, blobs };
   return { config, logSpies: mockLoggers() };
}
