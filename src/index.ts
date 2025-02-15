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
import { downloadFiles } from "./downloader.js";
import { processBlobOption } from "./processor.js";
import schemas from "./schemas.js";
import utils from "./utils.js";

async function pluginMain(config: t.PluginConfig): Promise<void> {
   const contents: t.HistoryFileContents = utils.readHistoryFile();
   const promises = config.blobs.map((option: t.RemoteBlobOption, index: number) => {
      return processBlobOption({ contents, option, index });
   });
   const results: t.ProcessorReturn[] = await Promise.all(promises);

   const mustDownload = results.filter((res) => !!res[1]) as t.MustDownload[];
   await downloadFiles({ config, mustDownload });

   const entries: t.HistoryFileEntry[] = results.map((res) => res[0]);
   utils.writeHistoryFile(entries);
}

export function pullRemoteBlobPlugin(config?: t.PluginConfig): Plugin {
   assert(config, schemas.PluginConfigStruct);
   return {
      name: "pull-remote-blob",
      buildStart: async () => {
         config.blobs.length > 0 ? await pluginMain(config) : null;
      },
   };
}
