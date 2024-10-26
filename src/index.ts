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

import type { Plugin } from "rollup";
import { assert } from "superstruct";
import type { HistoryFileContents, HistoryFileEntry, RemoteBlobOption } from "../types/internal";
import archive from "./archive";
import history from "./history";
import schemas from "./schemas";
import utils from "./utils";

async function optionProcessor(
   option: RemoteBlobOption,
   oldEntry?: HistoryFileEntry,
): Promise<HistoryFileEntry> {
   assert(option, schemas.RemoteBlobOptionStruct);
   const dest = utils.getDestDetails(option);
   const newEntry: HistoryFileEntry = {
      url: option.url,
      dest: option.dest,
   };
   if (oldEntry?.decompressedFiles) {
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
   } else if (dest.fileExists) {
      return newEntry;
   }
   await utils.downloadFile(option, dest);
   if (option.decompress) {
      newEntry.decompressedFiles = await archive.decompressArchive(option, dest);
      newEntry.decompressOptionsDigest = archive.digestDecompressOptions(option.decompress);
   }
   return newEntry;
}

export function pullRemoteBlobPlugin(options?: RemoteBlobOption[]): Plugin {
   return {
      name: "pull-remote-blob",
      buildStart: async () => {
         if (Array.isArray(options)) {
            const contents: HistoryFileContents = history.readFile();
            const pullPromises = options.map((option: RemoteBlobOption) => {
               const digest = utils.digestString(option.url, 32);
               const oldEntry = digest in contents ? contents[digest] : undefined;
               return optionProcessor(option, oldEntry);
            });
            const entries: HistoryFileEntry[] = await Promise.all(pullPromises);
            history.writeFile(entries);
         }
      },
   };
}
