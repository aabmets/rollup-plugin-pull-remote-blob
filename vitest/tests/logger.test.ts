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

import log from "@src/logger";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("logger", () => {
   afterEach(vi.restoreAllMocks);

   it("should log info nothing to download", () => {
      const spy = vi.spyOn(console, "info");
      spy.mockImplementation(() => undefined);
      log.nothingToDownload();
      expect(spy).toHaveBeenCalled();
   });

   it("should log info all files exist", () => {
      const spy = vi.spyOn(console, "info");
      spy.mockImplementation(() => undefined);
      log.allFilesExist();
      expect(spy).toHaveBeenCalled();
   });

   it("should log info downloading remote blobs", () => {
      const spy = vi.spyOn(console, "info");
      spy.mockImplementation(() => undefined);
      log.downloadingRemoteBlobs();
      expect(spy).toHaveBeenCalled();
   });

   it("should log error all downloads failed", () => {
      const spy = vi.spyOn(console, "error");
      spy.mockImplementation(() => undefined);
      log.allDownloadsFailed([]);
      expect(spy).toHaveBeenCalled();
   });

   it("should log error some downloads failed", () => {
      const spy = vi.spyOn(console, "error");
      spy.mockImplementation(() => undefined);
      log.someDownloadsFailed([]);
      expect(spy).toHaveBeenCalled();
   });

   it("should log info all downloads complete", () => {
      const spy = vi.spyOn(console, "info");
      spy.mockImplementation(() => undefined);
      log.allDownloadsComplete();
      expect(spy).toHaveBeenCalled();
   });
});
