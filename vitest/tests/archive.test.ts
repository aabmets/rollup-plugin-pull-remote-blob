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

import type { Dirent } from "node:fs";
import fsp from "node:fs/promises";
import archive from "@src/archive";
import type * as t from "@types";
import type { DecompressOptions, File } from "decompress";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("decompress", () => {
   return {
      default: vi.fn((_, __, opts: DecompressOptions): File[] => {
         const file: File = {
            data: Buffer.from("asdfg"),
            mode: 1,
            mtime: "mtime",
            type: "file",
            path: "/absolute/path/only_file.txt",
         };
         if (opts?.filter) {
            return opts.filter(file) ? [file] : [];
         }
         return [file];
      }),
   };
});
import decompress from "decompress";

describe("digestDecompressionOptions", () => {
   it("should return empty string when arg is undefined", () => {
      const result = archive.digestDecompressionOptions(undefined);
      expect(result).toEqual("");
   });

   it("should return a digest when arg is boolean", () => {
      const result = archive.digestDecompressionOptions(true);
      expect(typeof result).toEqual("string");
      expect(result.length).toBeGreaterThanOrEqual(32);
   });

   it("should return a digest when arg is an object", () => {
      for (const obj of [{}, { filter: ["asdfg", /\w/], strip: 3 }]) {
         const result = archive.digestDecompressionOptions(obj);
         expect(typeof result).toEqual("string");
         expect(result.length).toBeGreaterThanOrEqual(32);
      }
   });
});

describe("allDecompressedFilesExist", () => {
   afterEach(vi.clearAllMocks);

   it("should check if all decompressed files exist", async () => {
      const entry: t.HistoryFileEntry = {
         url: "",
         dest: "",
         blobOptionsDigest: "",
         decompression: {
            optionsDigest: "",
            filesList: ["asdfgh.txt", "qwerty.txt", "zxcvbn.txt"],
         },
      };
      const details: t.DestDetails = {
         fileName: "",
         fileExists: false,
         filePath: "",
         dirExists: true,
         dirPath: "/absolute/path",
      };
      const spy = vi.spyOn(fsp, "access");

      spy.mockImplementation(() => Promise.resolve(undefined));
      const result1 = await archive.allDecompressedFilesExist(entry, details);
      expect(result1).toEqual(true);
      expect(spy).toHaveBeenCalledTimes(3);

      spy.mockClear();

      spy.mockImplementation(() => Promise.reject(undefined));
      const result2 = await archive.allDecompressedFilesExist(entry, details);
      expect(result2).toEqual(false);
      expect(spy).toHaveBeenCalledTimes(3);
   });
});

describe("removeAllDecompressedFiles", () => {
   afterEach(vi.clearAllMocks);

   const details: t.DestDetails = {
      fileName: "",
      fileExists: false,
      filePath: "",
      dirExists: true,
      dirPath: "/absolute/path",
   };
   const entry: t.HistoryFileEntry = {
      url: "",
      dest: "",
      blobOptionsDigest: "",
      decompression: {
         optionsDigest: "",
         filesList: [],
      },
   };

   it("should return early when filesList is empty", async () => {
      const rmdirSpy = vi.spyOn(fsp, "rmdir");
      const unlinkSpy = vi.spyOn(fsp, "unlink");
      const readdirSpy = vi.spyOn(fsp, "readdir");

      await archive.removeAllDecompressedFiles(entry, details);
      expect(unlinkSpy).toHaveBeenCalledTimes(0);
      expect(readdirSpy).toHaveBeenCalledTimes(0);
      expect(rmdirSpy).toHaveBeenCalledTimes(0);
   });

   it("should remove all decompressed files", async () => {
      const entryWithFiles = {
         ...entry,
         decompression: {
            optionsDigest: "",
            filesList: ["asdfgh.txt", "qwerty.txt", "zxcvbn.txt"],
         },
      };
      const rmdirSpy = vi.spyOn(fsp, "rmdir");
      const unlinkSpy = vi.spyOn(fsp, "unlink");
      const readdirSpy = vi.spyOn(fsp, "readdir");

      rmdirSpy.mockImplementation(() => Promise.resolve(undefined));
      unlinkSpy.mockImplementation(() => Promise.resolve(undefined));
      readdirSpy.mockImplementationOnce(() => Promise.resolve([]));

      await archive.removeAllDecompressedFiles(entryWithFiles, details);
      expect(unlinkSpy).toHaveBeenCalledTimes(3);
      expect(readdirSpy).toHaveBeenCalledTimes(1);
      expect(rmdirSpy).toHaveBeenCalledTimes(1);

      rmdirSpy.mockClear();
      unlinkSpy.mockClear();
      readdirSpy.mockClear();
      readdirSpy.mockImplementationOnce(() => Promise.resolve([{} as Dirent]));

      await archive.removeAllDecompressedFiles(entryWithFiles, details);
      expect(unlinkSpy).toHaveBeenCalledTimes(3);
      expect(readdirSpy).toHaveBeenCalledTimes(1);
      expect(rmdirSpy).toHaveBeenCalledTimes(0);
   });
});

describe("decompressArchive", () => {
   afterEach(vi.clearAllMocks);
   const option: t.RemoteBlobOption = { url: "", dest: "" };
   const details: t.DestDetails = {
      fileName: "",
      fileExists: false,
      filePath: "",
      dirExists: true,
      dirPath: "/absolute/path",
   };

   it("should decompress archive without options", async () => {
      const spy1 = vi.spyOn(fsp, "unlink");
      const result = await archive.decompressArchive({ option, details });
      expect(result).toEqual(["/absolute/path/only_file.txt"]);
      expect(decompress).toHaveBeenCalledOnce();
      expect(spy1).toHaveBeenCalledOnce();
   });

   it("should decompress archive with empty option", async () => {
      const spy = vi.spyOn(fsp, "unlink");
      const result = await archive.decompressArchive({
         option: { ...option, decompress: {} },
         details,
      });
      expect(result).toEqual(["/absolute/path/only_file.txt"]);
      expect(decompress).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledOnce();
   });

   it("should decompress archive with filtering option", async () => {
      const spy = vi.spyOn(fsp, "unlink");
      const result = await archive.decompressArchive({
         option: { ...option, decompress: { filter: ["only_file.txt"] } },
         details,
      });
      expect(result).toEqual(["/absolute/path/only_file.txt"]);
      expect(decompress).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledOnce();
   });
});
