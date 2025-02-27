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
   const { contents, option } = args;

   const dcmpOptDigest = archive.digestDecompressionOptions(option.decompress);
   const blobOptDigest = utils.digestRemoteBlobOption(option);
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
   const mustDownload = {
      option,
      entry: newEntry,
      details: newDetails,
      skipDownload: false,
   };

   if (blobOptDigest in contents) {
      const oldEntry = contents[blobOptDigest];
      const oldDetails = utils.getDestDetails(oldEntry);
      const skipDownload = {
         option,
         entry: oldEntry,
         details: oldDetails,
         skipDownload: true,
      };
      if (
         !option.alwaysPull &&
         newDetails.fileExists &&
         oldEntry.blobOptionsDigest === newEntry.blobOptionsDigest
      ) {
         return skipDownload;
      }
      if (oldEntry.decompression.filesList.length > 0) {
         const allExist = await archive.allDecompressedFilesExist(oldEntry);
         if (
            !option.alwaysPull &&
            allExist &&
            dcmpOptDigest === oldEntry.decompression.optionsDigest
         ) {
            return skipDownload;
         } else {
            await archive.removeAllDecompressedFiles(oldEntry);
            return mustDownload;
         }
      }
      if (oldDetails.fileExists) {
         await fsp.unlink(oldDetails.filePath);
         return mustDownload;
      }
   }
   return mustDownload;
}
