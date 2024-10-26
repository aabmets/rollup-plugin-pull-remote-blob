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

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import axios from "axios";
import utils from "../src/utils";
import type { DestDetails, RemoteBlobOption } from "../types/internal";

jest.mock("axios");
jest.mock("node:fs");
jest.mock("node:fs/promises");

function getPathsForSorting(sep: string) {
   return {
      filePaths: [
         `parent${sep}dir${sep}file1.txt`,
         `parent${sep}dir${sep}subdir${sep}file2.txt`,
         `parent${sep}dir${sep}subdir${sep}subsubdir${sep}file3.txt`,
         `parent${sep}file4.txt`,
      ],
      expected: [
         `parent${sep}dir${sep}subdir${sep}subsubdir${sep}file3.txt`,
         `parent${sep}dir${sep}subdir${sep}file2.txt`,
         `parent${sep}dir${sep}file1.txt`,
         `parent${sep}file4.txt`,
      ],
   };
}

describe("utils", () => {
   afterEach(() => {
      jest.clearAllMocks();
   });

   test("sortPathsByDepth with Unix separators", () => {
      const { filePaths, expected } = getPathsForSorting("/");
      expect(utils.sortPathsByDepth(filePaths, "/")).toEqual(expected);
   });

   test("sortPathsByDepth with Windows separators", () => {
      const { filePaths, expected } = getPathsForSorting("\\");
      expect(utils.sortPathsByDepth(filePaths, "\\")).toEqual(expected);
   });

   test("digestString", () => {
      let digest = utils.digestString("asdfg");
      expect(digest).toEqual("f969fdbe811d8a66010d6f8973246763147a2a0914afc8087839e29b563a5af0");

      digest = utils.digestString("asdfg", 32);
      expect(digest).toEqual("f969fdbe811d8a66010d6f8973246763");

      digest = utils.digestString("asdfg", 8);
      expect(digest).toEqual("f969fdbe");
   });

   test("getDestDetails", () => {
      const option: RemoteBlobOption = {
         url: "https://www.example.com/somefile.exe",
         dest: "./resources",
      };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const dest: DestDetails = utils.getDestDetails(option);
      expect(dest.fileExists).toEqual(true);
      expect(dest.dirPath).toEqual(path.resolve(option.dest));
   });

   test("downloadFile", async () => {
      const mockedFsp = fsp as jest.Mocked<typeof fsp>;
      const mockedAxios = axios as jest.Mocked<typeof axios>;

      mockedFsp.mkdir.mockResolvedValue(undefined);
      mockedFsp.writeFile.mockResolvedValue(undefined);
      mockedAxios.get.mockResolvedValue({
         data: Buffer.from("file data"),
      });

      const mockOption: RemoteBlobOption = {
         url: "https://www.example.com/file",
         dest: "/some/path",
      };
      const mockDest: DestDetails = {
         fileExists: false,
         filePath: "/some/path/file.txt",
         dirExists: true,
         dirPath: "/some/path",
         isFile: true,
      };
      await utils.downloadFile(mockOption, mockDest);

      expect(mockedFsp.mkdir).toHaveBeenCalledWith(mockDest.dirPath, { recursive: true });
      expect(mockedAxios.get).toHaveBeenCalledWith(mockOption.url, { responseType: "arraybuffer" });
      expect(mockedFsp.writeFile).toHaveBeenCalledWith(mockDest.filePath, Buffer.from("file data"));
   });
});
