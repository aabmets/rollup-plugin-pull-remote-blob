/*
 *   Apache License
 *
 *   Copyright (c) 2024, Mattias Aabmets
 *
 *   The contents of this file are subject to the terms and conditions defined in the License.
 *   You may not use, modify, or distribute this file except in compliance with the License.
 *
 *   SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs";
import * as c from "@src/constants";
import * as d from "@src/downloader";
import utils from "@src/utils";
import type * as t from "@types";
import { vi } from "vitest";
import { mockLoggers } from "./various.js";

export function setupPluginMainTest(
   status1: t.BarStatus,
   status2?: t.BarStatus,
   addHistoryEntry?: boolean,
) {
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

   const option: t.RemoteBlobOption = {
      url: "https://www.example.com/testFile.txt",
      dest: "download",
   };
   vi.spyOn(fs, "existsSync").mockReturnValue(true);
   vi.spyOn(utils, "writeHistoryFile").mockImplementation(() => undefined);
   vi.spyOn(utils, "readHistoryFile").mockImplementation(() => {
      const contents: t.HistoryFileContents = {};
      if (addHistoryEntry) {
         const digest = utils.digestRemoteBlobOption(option);
         contents[digest] = {
            ...option,
            blobOptionsDigest: digest,
            decompression: {
               optionsDigest: "",
               filesList: [],
            },
         };
      }
      return contents;
   });
   return {
      config: { ...c.defaultPluginConfig, blobs: [option] },
      logSpies: mockLoggers(),
   };
}
