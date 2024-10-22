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
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import tools from "../src/tools";
import type { HistoryFileContents, HistoryFileEntry } from "../types/internal";

jest.mock("node:fs");

describe("history file tools", () => {
   afterEach(() => {
      jest.clearAllMocks();
   });

   const historyFileEntries: HistoryFileEntry[] = [
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
   const historyFileContents: HistoryFileContents = {
      e2fd89c1775747c64242a337f5a15b96: historyFileEntries[0],
      "290c99fb352d216f159a0db7e3b2cd73": historyFileEntries[1],
   };

   test("get history file contents", () => {
      const contents = tools.getHistoryFileContents(historyFileEntries);
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
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(historyFileContents));
      const result: HistoryFileContents = tools.readHistory();
      expect(result).toEqual(historyFileContents);
   });

   test("read empty history file", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue("{}");
      const result: HistoryFileContents = tools.readHistory();
      expect(result).toEqual({});
   });

   test("write data to history file", () => {
      (fs.mkdirSync as jest.Mock).mockImplementation(() => null);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => null);
      tools.writeHistory(historyFileEntries);

      const dirname = path.dirname(tools.HISTORY_FILE_PATH);
      expect(fs.mkdirSync).toHaveBeenCalledWith(dirname, { recursive: true });
      const contents = tools.getHistoryFileContents(historyFileEntries);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
         tools.HISTORY_FILE_PATH,
         JSON.stringify(contents, null, 2),
      );
   });
});
