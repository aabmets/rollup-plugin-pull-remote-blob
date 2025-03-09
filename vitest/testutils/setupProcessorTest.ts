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

import fsp from "node:fs/promises";
import archive from "@src/archive";
import utils from "@src/utils";
import type * as t from "@types";
import { type MockInstance, vi } from "vitest";

export function setupProcessorTest(args?: {
   newFileExists?: boolean;
   oldFileExists?: boolean;
   alwaysPull?: boolean;
   decompress?: boolean | t.DecompressionOptions;
   decompFilesExist?: boolean;
   filesList?: string[];
}): [t.RemoteBlobOption, t.HistoryFileContents, MockInstance] {
   const option: t.RemoteBlobOption = {
      url: "https://example.com/file.zip",
      dest: "some/path/testFile.zip",
      alwaysPull: args?.alwaysPull ?? false,
      decompress: args?.decompress ?? false,
   };
   const blobDigest = utils.digestRemoteBlobOption(option);
   const decompDigest = archive.digestDecompressionOptions(option.decompress);
   const contents: t.HistoryFileContents = {
      [blobDigest]: {
         url: "https://example.com/file.zip",
         dest: "/some/path/testFile.zip",
         blobOptionsDigest: blobDigest,
         decompression: {
            optionsDigest: decompDigest,
            filesList: args?.filesList ?? [],
         },
      },
   };
   const getDestDetails = (exists?: boolean) => {
      return {
         filePath: "/some/path/testFile.zip",
         fileExists: !!exists,
         dirPath: "/some/path",
         dirExists: !!exists,
         fileName: "testFile.zip",
      };
   };
   vi.spyOn(utils, "getDestDetails")
      .mockImplementationOnce(() => getDestDetails(args?.newFileExists))
      .mockImplementationOnce(() => getDestDetails(args?.oldFileExists));
   if (args?.decompress) {
      vi.spyOn(archive, "allDecompressedFilesExist").mockResolvedValue(!!args?.decompFilesExist);
      vi.spyOn(archive, "removeAllDecompressedFiles").mockImplementation(() => Promise.resolve());
   }
   const unlinkMock = vi.spyOn(fsp, "unlink").mockResolvedValue();
   return [option, contents, unlinkMock];
}
