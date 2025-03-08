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

import type * as t from "@types";
import { assert } from "superstruct";
import * as c from "./constants.js";
import * as d from "./downloader.js";
import log from "./logger.js";
import { processBlobOption } from "./processor.js";
import { PluginConfigStruct } from "./schemas.js";
import utils from "./utils.js";

export async function pluginMain(config: t.MergedConfig): Promise<void> {
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
      const results = await d.downloadFiles({ config, mustDownload });

      const errorPredicate = ({ status }: t.WorkerResult) => status === c.barStatus.error;
      if (results.every(errorPredicate)) {
         log.allDownloadsFailed(results);
      } else if (results.some(errorPredicate)) {
         log.someDownloadsFailed(results);
      } else {
         log.allDownloadsComplete();
      }
   } else {
      log.allFilesExist();
   }

   const entries = procRetArray.map((procRet) => procRet.entry);
   utils.writeHistoryFile(entries);
}

export function pullRemoteBlobPlugin(config?: t.PluginConfig): t.CustomPlugin {
   assert(config, PluginConfigStruct);
   const mergedConfig = { ...c.defaultPluginConfig, ...config };
   const hookHandler = async (hook: string) => {
      if (hook === mergedConfig.rollupHook) {
         await pluginMain(mergedConfig);
      }
   };
   return {
      name: "pull-remote-blob",
      buildStart: () => hookHandler("buildStart"),
      buildEnd: () => hookHandler("buildEnd"),
      writeBundle: () => hookHandler("writeBundle"),
      closeBundle: () => hookHandler("closeBundle"),
   };
}
