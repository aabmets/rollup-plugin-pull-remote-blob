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

import fsp from "node:fs/promises";
import path from "node:path";
import wrk from "node:worker_threads";
import * as c from "@src/constants";
import * as s from "@src/schemas";
import utils from "@src/utils";
import { Message, downloadFile } from "@src/worker";
import * as u from "@testutils";
import type * as t from "@types";
import { assert } from "superstruct";
import { describe, expect, it } from "vitest";

describe("worker_threads", () => {
   const options = { retry: 3 };

   it("should download and decompress archives", options, async () => {
      const option: t.RemoteBlobOption = {
         url: "https://github.com/aabmets/rollup-plugin-pull-remote-blob/archive/refs/heads/main.zip",
         dest: u.getTempDirPath(),
         decompress: {
            filter: ["README.md", "src"],
            strip: 1,
         },
      };
      const config = { blobs: [option] };
      assert(config, s.PluginConfigStruct);

      let details = utils.getDestDetails(option);
      expect(details.fileExists).toEqual(false);
      expect(details.dirExists).toEqual(false);

      const absolutePath = utils.searchUpwards(c.workerFilePath);
      const worker = new wrk.Worker(absolutePath, { workerData: { option, details } });
      let downloadedBytes = 0;

      const result: boolean = await new Promise((resolve, reject) => {
         worker.on("message", (message: t.WorkerMessage) => {
            if (message.type === "progress") {
               downloadedBytes += message.bytes;
            } else if (message.type === "done") {
               resolve(true);
            } else if (message.type === "error") {
               console.error(message.error);
               reject(false);
            }
         });
         worker.on("error", (err: Error) => {
            console.error(err.message);
            reject(false);
         });
         worker.on("exit", (code: number) => {
            if (code !== 0) {
               console.info(`Worker exited with code ${code}`);
               reject(false);
               return;
            }
            resolve(true);
         });
      });
      expect(result).toStrictEqual(true);
      expect(downloadedBytes).toBeGreaterThan(1000);

      details = utils.getDestDetails(option);
      expect(details.fileExists).toStrictEqual(false);
      expect(details.dirExists).toStrictEqual(true);

      const readmeFilePath = path.join(details.dirPath, "README.md");
      const stat1 = await fsp.stat(readmeFilePath);
      expect(stat1.isFile()).toStrictEqual(true);

      const srcDirPath = path.join(details.dirPath, "src");
      const stat2 = await fsp.stat(srcDirPath);
      expect(stat2.isDirectory()).toStrictEqual(true);

      const filesList = await fsp.readdir(srcDirPath);
      expect(filesList).toContain("index.ts");
   });
});

describe("Message", () => {
   const mocks = u.applyWorkerMocks();

   it("should post progress message", () => {
      const fakeBuffer = Buffer.alloc(10);
      Message.progress(fakeBuffer);
      expect(mocks.postMessage).toHaveBeenCalledWith({ type: "progress", bytes: 10 });
   });

   it("should post error message", () => {
      const error = new Error("Test error");
      Message.error(error);
      expect(mocks.postMessage).toHaveBeenCalledWith({ type: "error", error: "Test error" });
   });

   it("should post done message", () => {
      const filesList = ["file1.txt", "file2.txt"];
      Message.done(filesList);
      expect(mocks.postMessage).toHaveBeenCalledWith({ type: "done", filesList });
   });

   it("should post decompressing message", () => {
      Message.decompressing();
      expect(mocks.postMessage).toHaveBeenCalledWith({ type: "decompressing" });
   });
});

describe("downloadFile", () => {
   const mocks = u.applyWorkerMocks();

   it("should download file without decompressing", async () => {
      const [chunk] = u.setupWorkerTest({ decompress: false });
      await downloadFile();
      expect(mocks.postMessage).toHaveBeenCalledWith({ type: "progress", bytes: chunk.length });
      expect(mocks.postMessage).toHaveBeenCalledWith({ type: "done", filesList: [] });
   });

   it("should download file and decompress archive", async () => {
      const [chunk, fakeFilesList] = u.setupWorkerTest({ decompress: true });
      await downloadFile();
      expect(mocks.postMessage).toHaveBeenCalledWith({ type: "progress", bytes: chunk.length });
      expect(mocks.postMessage).toHaveBeenCalledWith({ type: "decompressing" });
      expect(mocks.postMessage).toHaveBeenCalledWith({ type: "done", filesList: fakeFilesList });
   });

   it("should send error message on response error", async () => {
      u.setupWorkerTest({ throwResponseError: true });
      await downloadFile().catch(() => null);
      expect(mocks.postMessage).toHaveBeenCalledWith({
         type: "error",
         error: "Fake response error",
      });
   });

   it("should send error message on file stream error", async () => {
      u.setupWorkerTest({ throwFileStreamError: true });
      await downloadFile().catch(() => null);
      expect(mocks.postMessage).toHaveBeenCalledWith({
         type: "error",
         error: "Fake file stream error",
      });
   });
});
