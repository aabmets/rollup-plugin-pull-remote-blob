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

import fsp from "node:fs/promises";
import type * as t from "@types";
import type { Plugin } from "rollup";
import { assert } from "superstruct";
import archive from "./archive.js";
import history from "./history.js";
import schemas from "./schemas.js";
import utils from "./utils.js";

async function blobProcessor(args: t.BlobProcessorArgs): Promise<t.HistoryFileEntry> {
   const { option, oldEntry } = args;
   const newDest = utils.getDestDetails(option);
   const newEntry: t.HistoryFileEntry = {
      url: option.url,
      dest: option.dest,
   };
   if (newDest.fileExists) {
      return newEntry;
   } else if (oldEntry?.decompressedFiles) {
      if (option?.decompress) {
         const allExist = archive.allDecompressedFilesExist(oldEntry);
         const newDigest = archive.digestDecompressOptions(option.decompress);
         if (allExist && newDigest === oldEntry.decompressOptionsDigest) {
            return oldEntry;
         } else if (newDigest !== oldEntry.decompressOptionsDigest) {
            await archive.removeAllDecompressedFiles(oldEntry);
         }
      } else {
         await archive.removeAllDecompressedFiles(oldEntry);
      }
   } else if (oldEntry) {
      const oldDest = utils.getDestDetails(oldEntry);
      if (oldDest.fileExists) {
         await fsp.unlink(oldDest.filePath);
      }
   }
   await utils.downloadFile(option, newDest);
   if (option.decompress) {
      newEntry.decompressedFiles = await archive.decompressArchive(option, newDest);
      newEntry.decompressOptionsDigest = archive.digestDecompressOptions(option.decompress);
   }
   return newEntry;
}

export function pullRemoteBlobPlugin(config?: t.PluginConfig): Plugin {
   assert(config, schemas.PluginConfigStruct);
   return {
      name: "pull-remote-blob",
      buildStart: async () => {
         const contents: t.HistoryFileContents = history.readFile();
         const pullPromises = config.blobs.map((option: t.RemoteBlobOption) => {
            assert(option, schemas.RemoteBlobOptionStruct);
            const digest = utils.digestString(JSON.stringify(option), 32);
            const oldEntry = digest in contents ? contents[digest] : undefined;
            return blobProcessor({ option, oldEntry });
         });
         const entries: t.HistoryFileEntry[] = await Promise.all(pullPromises);
         history.writeFile(entries);
      },
   };
}
