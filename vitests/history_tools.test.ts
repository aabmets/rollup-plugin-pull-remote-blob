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
import path from "node:path";
import history from "@src/history";
import type * as t from "@types";
import { afterEach, describe, expect, test, vi } from "vitest";

describe("history file tools", () => {
   afterEach(() => {
      vi.clearAllMocks();
   });

   const historyFileEntries: t.HistoryFileEntry[] = [
      {
         url: "https://www.example.com/somefile.exe",
         dest: "./resources",
      },
      {
         url: "https://www.example.com/somearchive.zip",
         dest: "./extracted",
         decompressedFiles: ["somelib.dll", "LICENSE", "README.md"],
      },
   ];
   const historyFileContents: t.HistoryFileContents = {
      e2fd89c1775747c64242a337f5a15b96: historyFileEntries[0],
      "290c99fb352d216f159a0db7e3b2cd73": historyFileEntries[1],
   };

   test("get history file contents", () => {
      const contents = history.fileContentsFromEntries(historyFileEntries);
      const key1 = "e2fd89c1775747c64242a337f5a15b96";
      const key2 = "290c99fb352d216f159a0db7e3b2cd73";
      expect(contents).toHaveProperty(key1);
      expect(contents).toHaveProperty(key2);
      for (const key of [key1, key2]) {
         expect(contents[key]).toHaveProperty("url");
         expect(contents[key]).toHaveProperty("dest");
      }
      expect(contents[key1]).not.toHaveProperty("decompressedFiles");
      expect(contents[key2]).toHaveProperty("decompressedFiles");
      expect(contents[key2].decompressedFiles).toEqual(["somelib.dll", "LICENSE", "README.md"]);
   });

   test("read data from history file", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify(historyFileContents));
      const result: t.HistoryFileContents = history.readFile();
      expect(result).toEqual(historyFileContents);
   });

   test("read empty history file", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue("{}");
      const result: t.HistoryFileContents = history.readFile();
      expect(result).toEqual({});
   });

   test("write data to history file", () => {
      vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);
      history.writeFile(historyFileEntries);

      const dirname = path.dirname(history.FILE_PATH);
      expect(fs.mkdirSync).toHaveBeenCalledWith(dirname, { recursive: true });
      const contents = history.fileContentsFromEntries(historyFileEntries);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
         history.FILE_PATH,
         JSON.stringify(contents, null, 2),
      );
   });
});
