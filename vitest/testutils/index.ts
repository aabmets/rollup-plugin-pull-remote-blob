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

import crypto from "node:crypto";
import fsp from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import archive from "@src/archive";
import utils from "@src/utils";
import type * as t from "@types";
import { type MockInstance, vi } from "vitest";

export function getTempDirPath() {
   const randString = crypto.randomBytes(16).toString("hex");
   return path.join(tmpdir(), "vitest", randString);
}

export function getMustDownload(prettyName1?: string, prettyName2?: string): t.ProcessorReturn[] {
   return [
      {
         skipDownload: false,
         option: {
            url: "https://www.example.com/first_file.json",
            dest: "downloads",
            prettyName: prettyName1,
         },
         entry: {
            blobOptionsDigest: "digest1",
         },
         details: {
            fileName: "longerfilename.txt",
         },
      } as t.ProcessorReturn,
      {
         skipDownload: true,
         option: {
            url: "https://www.example.com/second_file.json",
            dest: "downloads",
            prettyName: prettyName2,
         },
         entry: {
            blobOptionsDigest: "digest2",
         },
         details: {
            fileName: "shortername.txt",
         },
      } as t.ProcessorReturn,
   ];
}

export interface SetupArgs {
   newFileExists?: boolean;
   oldFileExists?: boolean;
   alwaysPull?: boolean;
   decompress?: boolean | t.DecompressionOptions;
   decompFilesExist?: boolean;
   filesList?: string[];
}

export type SetupReturn = [t.RemoteBlobOption, t.HistoryFileContents, MockInstance];

export function setupProcessorTest(args?: SetupArgs): SetupReturn {
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
