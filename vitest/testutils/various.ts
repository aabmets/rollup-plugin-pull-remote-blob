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

import crypto from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import log from "@src/logger";
import { vi } from "vitest";

export function getTempDirPath() {
   const randString = crypto.randomBytes(16).toString("hex");
   return path.join(tmpdir(), "vitest", randString);
}

export function mockLoggers() {
   const spies = {
      nothingToDownload: vi.spyOn(log, "nothingToDownload"),
      downloadingRemoteBlobs: vi.spyOn(log, "downloadingRemoteBlobs"),
      allDownloadsFailed: vi.spyOn(log, "allDownloadsFailed"),
      someDownloadsFailed: vi.spyOn(log, "someDownloadsFailed"),
      allDownloadsComplete: vi.spyOn(log, "allDownloadsComplete"),
      allFilesExist: vi.spyOn(log, "allFilesExist"),
   };
   Object.values(spies).forEach((spy) => {
      spy.mockImplementation(() => undefined);
   });
   return spies;
}
