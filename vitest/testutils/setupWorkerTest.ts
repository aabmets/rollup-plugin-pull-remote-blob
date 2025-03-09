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
import fsp from "node:fs/promises";
import { PassThrough } from "node:stream";
import wrk from "node:worker_threads";
import archive from "@src/archive";
import axios from "axios";
import { afterEach, beforeEach, vi } from "vitest";

export function applyWorkerMocks(): { postMessage: typeof vi.fn } {
   const mocks = { postMessage: vi.fn() };
   afterEach(vi.restoreAllMocks);
   beforeEach(() => {
      mocks.postMessage = vi.fn();
      Object.defineProperty(wrk, "parentPort", {
         value: { postMessage: mocks.postMessage },
         writable: true,
         configurable: true,
      });
   });
   return mocks;
}

export function setupWorkerTest(args: {
   decompress?: boolean;
   throwResponseError?: boolean;
   throwFileStreamError?: boolean;
}): [Buffer, string[]] {
   Object.defineProperty(wrk, "workerData", {
      value: {
         option: { url: "http://example.com/file", decompress: !!args.decompress },
         details: { dirPath: "fake-dir", filePath: "fake-dir/file.txt" },
      },
      writable: true,
      configurable: true,
   });

   const fakeResponseStream = new PassThrough();
   const fakeFileStream = new PassThrough() as unknown as fs.WriteStream;
   vi.spyOn(fs, "createWriteStream").mockReturnValue(fakeFileStream);
   vi.spyOn(axios, "get").mockResolvedValue({ data: fakeResponseStream });

   const fakeFilesList = ["file1.txt", "file2.txt"];
   vi.spyOn(archive, "decompressArchive").mockResolvedValue(fakeFilesList);
   vi.spyOn(fsp, "mkdir").mockResolvedValue(undefined);

   const chunk = Buffer.from("chunk data");
   process.nextTick(() => {
      if (args.throwResponseError) {
         fakeResponseStream.emit("error", new Error("Fake response error"));
      } else if (args.throwFileStreamError) {
         fakeFileStream.emit("error", new Error("Fake file stream error"));
      } else {
         fakeResponseStream.emit("data", chunk);
         fakeResponseStream.emit("end");
         fakeFileStream.end();
      }
   });

   return [chunk, fakeFilesList];
}
