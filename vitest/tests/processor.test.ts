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

import { processBlobOption } from "@src/processor";
import * as u from "@testutils";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("processBlobOption", () => {
   afterEach(vi.restoreAllMocks);

   it("should download when historical entry does not exist", async () => {
      const [option] = u.setupProcessorTest();
      const procRet = await processBlobOption({ contents: {}, option });
      expect(procRet.skipDownload).toEqual(false);
   });

   it("should download when historical entry exists and alwaysPull is true", async () => {
      const [option, contents] = u.setupProcessorTest({ alwaysPull: true });
      const procRet = await processBlobOption({ contents, option });
      expect(procRet.skipDownload).toEqual(false);
   });

   it("should skip download when all decompressed files exist", async () => {
      const [option, contents] = u.setupProcessorTest({
         decompress: true,
         decompFilesExist: true,
         filesList: ["asdfg.txt"],
      });
      const procRet = await processBlobOption({ contents, option });
      expect(procRet.skipDownload).toEqual(true);
   });

   it("should download when all decompressed files do not exist", async () => {
      const [option, contents] = u.setupProcessorTest({
         decompress: true,
         decompFilesExist: false,
         filesList: ["asdfg.txt"],
      });
      const procRet = await processBlobOption({ contents, option });
      expect(procRet.skipDownload).toEqual(false);
   });

   it("should skip download when option file file exists", async () => {
      const [option, contents] = u.setupProcessorTest({ newFileExists: true });
      const procRet = await processBlobOption({ contents, option });
      expect(procRet.skipDownload).toEqual(true);
   });

   it("should download when historical file exists and option file does not", async () => {
      const [option, contents, unlinkMock] = u.setupProcessorTest({ oldFileExists: true });
      const procRet = await processBlobOption({ contents, option });
      expect(procRet.skipDownload).toEqual(false);
      expect(unlinkMock).toHaveBeenCalledOnce();
   });
});
