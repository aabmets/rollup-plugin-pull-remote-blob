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

import type * as t from "@types";
import axios, { AxiosHeaders, type AxiosResponse } from "axios";
import type { MockInstance } from "vitest";
import { vi } from "vitest";

export function setupAxiosHeadTest(args?: {
   sizeBytes?: number;
   contentLength?: number;
   throwError?: string;
}): [MockInstance, t.ProcessorReturn] {
   const procRet: t.ProcessorReturn = {
      skipDownload: false,
      option: {
         url: "https://example.com",
         dest: "dest",
         sizeBytes: args?.sizeBytes,
      } as t.RemoteBlobOption,
      entry: {
         url: "https://example.com",
         dest: "dest",
         blobOptionsDigest: "dummyDigest",
         decompression: {
            optionsDigest: "dummyOptionsDigest",
            filesList: [],
         },
      } as t.HistoryFileEntry,
      details: {
         fileName: "file.txt",
         fileExists: false,
         filePath: "/dummy/file.txt",
         dirExists: false,
         dirPath: "/dummy",
      } as t.DestDetails,
   };
   const response: AxiosResponse = {
      data: null,
      status: 200,
      statusText: "OK",
      headers: args?.contentLength ? { "content-length": args?.contentLength } : {},
      config: { headers: new AxiosHeaders() },
   };
   const headSpy = vi.spyOn(axios, "head");
   if (args?.throwError) {
      headSpy.mockRejectedValue(new Error(args.throwError));
   } else {
      headSpy.mockResolvedValue(response);
   }
   return [headSpy, procRet];
}
