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

import type * as t from "@types";
import type { Plugin } from "rollup";
import { assert } from "superstruct";
import { defaultPluginConfig } from "./constants.js";
import { downloadFiles } from "./downloader.js";
import { processBlobOption } from "./processor.js";
import { PluginConfigStruct } from "./schemas.js";
import utils from "./utils.js";

async function pluginMain(config: t.PluginConfig): Promise<void> {
   const contents: t.HistoryFileContents = utils.readHistoryFile();
   const promises = config.blobs.map((option) => {
      return processBlobOption({ contents, option });
   });
   const procRetArray: t.ProcessorReturn[] = await Promise.all(promises);
   const mustDownload = procRetArray.filter((procRet) => !procRet.skipDownload);
   await downloadFiles({ config, mustDownload });

   const entries = procRetArray.map((procRet) => procRet.entry);
   utils.writeHistoryFile(entries);
}

export function pullRemoteBlobPlugin(config?: t.PluginConfig): Plugin {
   assert(config, PluginConfigStruct);
   return {
      name: "pull-remote-blob",
      buildStart: async () => {
         if (config.blobs.length > 0) {
            await pluginMain({
               ...defaultPluginConfig,
               ...config,
            });
         }
      },
   };
}
