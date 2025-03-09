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

import * as d from "@src/downloader";
import * as u from "@testutils";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("setRemoteFileSizeBytes", () => {
   afterEach(vi.restoreAllMocks);

   it("should use the provided sizeBytes if present", async () => {
      const [headSpy, procRet] = u.setupAxiosHeadTest({ sizeBytes: 123 });
      await d.setRemoteFileSizeBytes(procRet);

      expect(headSpy).not.toHaveBeenCalled();
      expect(procRet.option.sizeBytes).toBe(123);
   });

   it("should fetch sizeBytes with axios.head request when not provided", async () => {
      const [headSpy, procRet] = u.setupAxiosHeadTest({ contentLength: 456 });
      await d.setRemoteFileSizeBytes(procRet);

      expect(headSpy).toHaveBeenCalledWith(procRet.option.url);
      expect(procRet.option.sizeBytes).toBe(456);
   });

   it("should leave sizeBytes undefined if axios.head does not return content-length", async () => {
      const [headSpy, procRet] = u.setupAxiosHeadTest();
      await d.setRemoteFileSizeBytes(procRet);

      expect(headSpy).toHaveBeenCalledWith(procRet.option.url);
      expect(procRet.option.sizeBytes).toBeUndefined();
   });

   it("should set errorMsg if axios.head throws an error", async () => {
      const [headSpy, procRet] = u.setupAxiosHeadTest({ throwError: "Network Error" });
      await d.setRemoteFileSizeBytes(procRet);

      expect(headSpy).toHaveBeenCalledWith(procRet.option.url);
      expect(procRet.errorMsg).toBe("Network Error");
      expect(procRet.option.sizeBytes).toBeUndefined();
   });
});
