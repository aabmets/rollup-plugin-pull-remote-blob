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

import fs from "node:fs";
import path from "node:path";
import utils from "@src/utils";
import * as u from "@testutils";
import type * as t from "@types";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

describe("searchUpwards", () => {
   const tempBase = u.getTempDirPath();
   const subDirName = "sub-dir";
   const nestedSubDirName = "nested-sub-dir";
   const targetFileName = "targetFile.txt";
   let subDirPath: string;
   let nestedSubDirPath: string;
   let targetFilePath: string;

   beforeAll(() => {
      fs.mkdirSync(tempBase, { recursive: true });
      subDirPath = path.join(tempBase, subDirName);
      fs.mkdirSync(subDirPath);
      nestedSubDirPath = path.join(subDirPath, nestedSubDirName);
      fs.mkdirSync(nestedSubDirPath);
      targetFilePath = path.join(tempBase, targetFileName);
      fs.writeFileSync(targetFilePath, "test file content");
   });

   afterAll(() => {
      fs.rmSync(tempBase, { recursive: true, force: true });
   });

   it("should find the file in the current directory", () => {
      const foundPath = utils.searchUpwards(targetFileName, tempBase);
      expect(foundPath).toBe(targetFilePath);
   });

   it("should find a file in a parent directory when starting from a nested directory", () => {
      const foundPath = utils.searchUpwards(targetFileName, nestedSubDirPath);
      expect(foundPath).toBe(targetFilePath);
   });

   it("should throw an error if a file is not found", () => {
      const searcher = () => utils.searchUpwards("nonexistent.txt", nestedSubDirPath);
      expect(searcher).toThrowError("Could not find path");
   });
});

describe("sortPathsByDepth", () => {
   it("should sort paths in descending order of depth", () => {
      const paths = ["src/utils", "src/utils/helpers", "src", "src/utils/helpers/subdir"];
      const sorted = utils.sortPathsByDepth(paths);
      expect(sorted).toEqual(["src/utils/helpers/subdir", "src/utils/helpers", "src/utils", "src"]);
   });

   it("should return original array of paths if its already sorted", () => {
      const paths = ["a/b/c", "a/b", "a"];
      const sorted = utils.sortPathsByDepth(paths);
      expect(sorted).toEqual(["a/b/c", "a/b", "a"]);
   });
});

describe("getDestDetails", () => {
   afterEach(vi.restoreAllMocks);

   it("should return correct details when destination is a file", () => {
      const data: t.UrlDest = {
         dest: "downloads/other_name.txt",
         url: "https://example.com/example.txt",
      };
      const result: t.DestDetails = utils.getDestDetails(data);
      expect(result).toEqual({
         fileName: "other_name.txt",
         filePath: path.resolve("downloads/other_name.txt"),
         dirPath: path.resolve("downloads"),
         fileExists: false,
         dirExists: false,
      });
   });

   it("should return correct details when destination is a directory", () => {
      const data: t.UrlDest = {
         dest: "downloads/nested",
         url: "https://example.com/example.txt",
      };
      const result: t.DestDetails = utils.getDestDetails(data);
      expect(result).toEqual({
         fileName: "example.txt",
         filePath: path.resolve("downloads/nested/example.txt"),
         dirPath: path.resolve("downloads/nested"),
         fileExists: false,
         dirExists: false,
      });
   });

   it("should return correct details when both file and directory exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      const data: t.UrlDest = {
         dest: "downloads/nested/other_name.txt",
         url: "https://example.com/example.txt",
      };
      const result: t.DestDetails = utils.getDestDetails(data);
      expect(result).toEqual({
         fileName: "other_name.txt",
         filePath: path.resolve("downloads/nested/other_name.txt"),
         dirPath: path.resolve("downloads/nested"),
         fileExists: true,
         dirExists: true,
      });
   });
});

describe("readHistoryFile", () => {
   afterEach(vi.restoreAllMocks);

   it("should return valid history data structure when file exists", () => {
      const mockData: t.HistoryFileContents = {
         entry1: {
            url: "https://example.com/file.zip",
            dest: "./downloads/file.zip",
            blobOptionsDigest: "abc123",
            decompression: {
               optionsDigest: "xyz456",
               filesList: ["file1.txt", "file2.txt"],
            },
         },
      };
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(mockData));
      const result = utils.readHistoryFile();
      expect(result).toEqual(mockData);
   });

   it("should return an empty object when history file does not exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const result = utils.readHistoryFile();
      expect(result).toEqual({});
   });

   it("should return an empty object when fs.readFileSync throws an error", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockImplementation(() => {
         throw new Error("File read error");
      });
      const result = utils.readHistoryFile();
      expect(result).toEqual({});
   });

   it("should return an empty object when JSON.parse throws an error", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue("invalid json");
      vi.spyOn(JSON, "parse").mockImplementation(() => {
         throw new Error("JSON parse error");
      });
      const result = utils.readHistoryFile();
      expect(result).toEqual({});
   });
});

describe("writeHistoryFile", () => {
   afterEach(vi.restoreAllMocks);

   const mockEntries: t.HistoryFileEntry[] = [
      {
         url: "https://example.com/file.zip",
         dest: "./downloads/file.zip",
         blobOptionsDigest: "abc123",
         decompression: {
            optionsDigest: "xyz456",
            filesList: ["file1.txt", "file2.txt"],
         },
      },
   ];
   it("should write correct history file content", () => {
      const expectedData: t.HistoryFileContents = {
         abc123: mockEntries[0],
      };
      let writtenData = "";
      vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
      vi.spyOn(fs, "writeFileSync").mockImplementation((_, data) => {
         writtenData = data as string;
      });
      utils.writeHistoryFile(mockEntries);
      expect(writtenData).toEqual(JSON.stringify(expectedData, null, 2));
   });

   it("should throw an error if fs.writeFileSync or JSON.stringify fails", () => {
      vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
         throw new Error("File write error");
      });
      expect(() => utils.writeHistoryFile(mockEntries)).toThrow("File write error");
      vi.restoreAllMocks();
      vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
      vi.spyOn(JSON, "stringify").mockImplementation(() => {
         throw new Error("JSON stringify error");
      });
      expect(() => utils.writeHistoryFile(mockEntries)).toThrow("JSON stringify error");
      vi.restoreAllMocks();
   });
});

describe("memoize", () => {
   it("should cache function results", () => {
      function slowFunction(x: number): number {
         return x * 2;
      }
      const spy = vi.fn(slowFunction);
      const memoizedSpy = utils.memoize(spy);
      expect(memoizedSpy(2)).toBe(4);
      expect(memoizedSpy(2)).toBe(4);
      expect(spy).toHaveBeenCalledTimes(1);
   });

   it("should handle different arguments separately", () => {
      function slowFunction(x: number): number {
         return x * 2;
      }
      const memoized = utils.memoize(slowFunction);
      expect(memoized(2)).toBe(4);
      expect(memoized(3)).toBe(6);
      expect(memoized(2)).toBe(4);
   });

   it("should work with complex argument types", () => {
      function complexFunc(obj: { value: number }): number {
         return obj.value * 2;
      }
      const memoized = utils.memoize(complexFunc);
      expect(memoized({ value: 5 })).toBe(10);
      expect(memoized({ value: 5 })).toBe(10);
   });
});
