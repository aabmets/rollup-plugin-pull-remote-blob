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

import archive from "@src/archive";
import * as c from "@src/constants";
import * as p from "@src/progress";
import utils from "@src/utils";
import type * as t from "@types";
import { getTempDirPath } from "./various";

export function getWorkerRunnerArgs(args?: { breakUrl?: boolean }): t.WorkerRunnerArgs {
   const url = [
      "https://github.com/aabmets",
      "/rollup-plugin-pull-remote-blob",
      "/archive/refs/heads/main.zip",
   ].join("");
   const option: t.RemoteBlobOption = {
      url: args?.breakUrl ? `${url}zzz` : url,
      dest: getTempDirPath(),
      decompress: {
         filter: ["README.md", "src"],
         strip: 1,
      },
   };
   const entry: t.HistoryFileEntry = {
      url: option.url,
      dest: option.dest,
      blobOptionsDigest: utils.digestRemoteBlobOption(option),
      decompression: {
         optionsDigest: archive.digestDecompressionOptions(option.decompress),
         filesList: [],
      },
   };
   return {
      config: {
         ...c.defaultPluginConfig,
         showProgress: false,
         blobs: [option],
      },
      procRet: {
         option,
         entry,
         details: utils.getDestDetails(option),
         skipDownload: false,
         errorMsg: undefined,
      },
      progBarMap: {
         [entry.blobOptionsDigest]: p.getDisabledController({
            fileName: "main.zip",
         } as unknown as t.ControllerArgs),
      },
      error: { isRaised: false },
   };
}
