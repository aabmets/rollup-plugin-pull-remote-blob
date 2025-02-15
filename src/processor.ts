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
import archive from "@src/archive";
import utils from "@src/utils";
import type * as t from "@types";

export async function processBlobOption(args: t.ProcessorArgs): Promise<t.ProcessorReturn> {
   const { contents, option, index } = args;

   const dcmpOptDigest = archive.digestDecompressOptions(option.decompress);
   const blobOptDigest = archive.digestRemoteBlobOption(option, dcmpOptDigest, index);
   const newDetails = utils.getDestDetails(option);
   const newEntry: t.HistoryFileEntry = {
      url: option.url,
      dest: option.dest,
      blobOptionsDigest: blobOptDigest,
      decompression: {
         optionsDigest: dcmpOptDigest,
         filesList: [],
      },
   };

   if (!option.alwaysPull) {
      const oldEntry = blobOptDigest in contents ? contents[blobOptDigest] : null;
      if (newDetails.fileExists) {
         if (oldEntry?.blobOptionsDigest === newEntry.blobOptionsDigest) {
            return [oldEntry, null]; // blob options have not changed, skip download
         }
      } else if (oldEntry) {
         if (oldEntry.decompression.filesList.length > 0) {
            const allExist = await archive.allDecompressedFilesExist(oldEntry);
            if (allExist && dcmpOptDigest === oldEntry.decompression.optionsDigest) {
               return [oldEntry, null]; // decompression options have not changed, skip download
            } else {
               await archive.removeAllDecompressedFiles(oldEntry);
               return [newEntry, option];
            }
         }
         const oldDetails = utils.getDestDetails(oldEntry as t.RemoteBlobOption);
         if (oldDetails.fileExists) {
            await fsp.unlink(oldDetails.filePath); // clean up old files and download
         }
      }
   }
   return [newEntry, option];
}
