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

import crypto from "node:crypto";
import fsp from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import * as c from "@src/constants";
import * as s from "@src/schemas";
import utils from "@src/utils";
import type * as t from "@types";
import { assert } from "superstruct";
import { describe, expect, test } from "vitest";

describe("worker", () => {
   test("download file", async () => {
      const option: t.RemoteBlobOption = {
         url: "https://github.com/aabmets/rollup-plugin-pull-remote-blob/archive/refs/heads/main.zip",
         dest: path.join(tmpdir(), "vitest", crypto.randomBytes(8).toString("hex")),
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
      const worker = new Worker(absolutePath, { workerData: { option, details } });
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
