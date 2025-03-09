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

import * as c from "@src/constants";
import * as u from "@testutils";
import type * as t from "@types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pluginMain, pullRemoteBlobPlugin } from "../../src";

describe("pluginMain", () => {
   afterEach(vi.restoreAllMocks);

   it("should report nothing to download", async () => {
      const logSpies = u.mockLoggers();
      await pluginMain({ ...c.defaultPluginConfig, blobs: [] });
      expect(logSpies.nothingToDownload).toHaveBeenCalledOnce();
   });

   it("should report all downloads complete", async () => {
      const { config, logSpies } = u.setupPluginMainTest(c.barStatus.done);
      await pluginMain(config);
      expect(logSpies.downloadingRemoteBlobs).toHaveBeenCalledOnce();
      expect(logSpies.allDownloadsComplete).toHaveBeenCalledOnce();
   });

   it("should report all downloads failed", async () => {
      const { config, logSpies } = u.setupPluginMainTest(c.barStatus.error);
      await pluginMain(config);
      expect(logSpies.downloadingRemoteBlobs).toHaveBeenCalledOnce();
      expect(logSpies.allDownloadsFailed).toHaveBeenCalledOnce();
   });

   it("should report some downloads failed", async () => {
      const { config, logSpies } = u.setupPluginMainTest(c.barStatus.done, c.barStatus.error);
      await pluginMain(config);
      expect(logSpies.downloadingRemoteBlobs).toHaveBeenCalledOnce();
      expect(logSpies.someDownloadsFailed).toHaveBeenCalledOnce();
   });

   it("should report all files exist", async () => {
      const { config, logSpies } = u.setupPluginMainTest(c.barStatus.done, undefined, true);
      await pluginMain(config);
      expect(logSpies.allFilesExist).toHaveBeenCalledOnce();
   });
});

describe("pullRemoteBlobPlugin", () => {
   afterEach(vi.restoreAllMocks);

   it("should throw error on invalid plugin config", () => {
      let config = { blobs: "asdfg" } as unknown as t.PluginConfig;
      expect(() => pullRemoteBlobPlugin(config)).toThrowError();

      config = { blobs: [], showProgress: 123 } as unknown as t.PluginConfig;
      expect(() => pullRemoteBlobPlugin(config)).toThrowError();

      config = { blobs: [], haltOnError: 123 } as unknown as t.PluginConfig;
      expect(() => pullRemoteBlobPlugin(config)).toThrowError();

      config = { blobs: [], rollupHook: 123 } as unknown as t.PluginConfig;
      expect(() => pullRemoteBlobPlugin(config)).toThrowError();
   });

   it("should return expected plugin object", async () => {
      const logSpies = u.mockLoggers();

      function runRollupHook(config: t.PluginConfig, hook: string) {
         const plugin = pullRemoteBlobPlugin(config);
         Object.entries(plugin).forEach(([key, value]) => {
            if (value instanceof Function) {
               value();
               const times = key === hook ? 1 : 0;
               expect(logSpies.nothingToDownload).toHaveBeenCalledTimes(times);
               vi.clearAllMocks();
            }
         });
      }

      let config = { blobs: [], rollupHook: "closeBundle" } as unknown as t.PluginConfig;
      runRollupHook(config, "closeBundle");

      config = { blobs: [], rollupHook: "buildStart" } as unknown as t.PluginConfig;
      runRollupHook(config, "buildStart");

      config = { blobs: [], rollupHook: "buildEnd" } as unknown as t.PluginConfig;
      runRollupHook(config, "buildEnd");

      config = { blobs: [], rollupHook: "writeBundle" } as unknown as t.PluginConfig;
      runRollupHook(config, "writeBundle");
   });
});
