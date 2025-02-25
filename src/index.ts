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
import { assert } from "superstruct";
import { defaultPluginConfig } from "./constants.js";
import { barStatus } from "./constants.js";
import { downloadFiles } from "./downloader.js";
import log from "./logger.js";
import { processBlobOption } from "./processor.js";
import { PluginConfigStruct } from "./schemas.js";
import utils from "./utils.js";

async function pluginMain(config: t.PluginConfig): Promise<void> {
   if (config.blobs.length === 0) {
      log.nothingToDownload();
      return;
   }
   const contents: t.HistoryFileContents = utils.readHistoryFile();
   const promises = config.blobs.map((option) => {
      return processBlobOption({ contents, option });
   });
   const procRetArray: t.ProcessorReturn[] = await Promise.all(promises);
   const mustDownload = procRetArray.filter((procRet) => !procRet.skipDownload);

   if (mustDownload.length > 0) {
      log.downloadingRemoteBlobs();
      const results = await downloadFiles({ config, mustDownload });

      if (results.some(({ status }) => status === barStatus.error)) {
         log.errorsDetected(results);
      } else {
         log.downloadCompleted();
      }
   } else {
      log.allFilesExist();
   }

   const entries = procRetArray.map((procRet) => procRet.entry);
   utils.writeHistoryFile(entries);
}

export function pullRemoteBlobPlugin(config?: t.PluginConfig): t.CustomPlugin {
   assert(config, PluginConfigStruct);
   return {
      name: "pull-remote-blob",
      buildStart: async () => {
         await pluginMain({
            ...defaultPluginConfig,
            ...config,
         });
      },
   };
}
