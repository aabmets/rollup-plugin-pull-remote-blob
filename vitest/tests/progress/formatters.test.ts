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

import * as c from "@src/constants";
import * as f from "@src/progress/formatters";
import type * as t from "@types";
import { describe, expect, it } from "vitest";

describe("formatters", () => {
   function getMustDownload(pn1?: string, pn2?: string): t.ProcessorReturn[] {
      return [
         {
            option: { url: "", dest: "", prettyName: pn1 },
            details: { fileName: "longerfilename.txt" },
         } as t.ProcessorReturn,
         {
            option: { url: "", dest: "", prettyName: pn2 },
            details: { fileName: "shortername.txt" },
         } as t.ProcessorReturn,
      ];
   }

   it("should get file name", () => {
      const [procRet1, procRet2] = getMustDownload("Test File", undefined);
      let result = f.getFileName(procRet1, 0);
      expect(result).toEqual("1) Test File");
      result = f.getFileName(procRet2, 9);
      expect(result).toEqual("10) shortername.txt");
   });

   it("should compute clamped file name length", () => {
      const mustDownload1 = getMustDownload(undefined, undefined);
      let result = f.clampedFileNameLength(mustDownload1);
      expect(result).toEqual("1) longerfilename.txt".length);

      const mustDownload2 = getMustDownload(undefined, "Even longer shorter name override");
      result = f.clampedFileNameLength(mustDownload2);
      expect(result).toEqual(c.fileNameMaxDisplayLength);

      const mustDownload3 = getMustDownload("asd", "qwe");
      result = f.clampedFileNameLength(mustDownload3);
      expect(result).toEqual(c.fileNameMinDisplayLength);
   });

   it("should format file name", () => {
      const mustDownload = getMustDownload("qwe", "Even longer shorter name override");
      let result = f.formatFileName(mustDownload, 0);
      expect(result).toEqual("1) qwe".padEnd(c.fileNameMaxDisplayLength));
      result = f.formatFileName(mustDownload, 1);
      expect(result).toEqual("2) Even longer shorter name o…");
   });

   it("should format file size", () => {
      let result = f.formatFileSize(undefined);
      expect(result).toEqual("   ??? B  ");
      result = f.formatFileSize(1023);
      expect(result).toEqual("  1023 B  ");
      result = f.formatFileSize(1024);
      expect(result).toEqual("   1.0 KiB");
      result = f.formatFileSize(1536);
      expect(result).toEqual("   1.5 KiB");
      result = f.formatFileSize(1024 ** 2 - 1);
      expect(result).toEqual("1024.0 KiB");
      result = f.formatFileSize(1024 ** 2);
      expect(result).toEqual("   1.0 MiB");
      result = f.formatFileSize(1024 ** 3 - 1);
      expect(result).toEqual("1024.0 MiB");
      result = f.formatFileSize(1024 ** 3);
      expect(result).toEqual("   1.0 GiB");
      result = f.formatFileSize(1024 ** 4 - 1);
      expect(result).toEqual("1024.0 GiB");
   });

   it("should format status", () => {
      for (const status of Object.values(c.barStatus)) {
         const result = f.formatStatus(status);
         expect(result).toEqual(status.text.padEnd(c.maxBarStatusTextLength));
      }
   });

   it("should format errors", () => {
      for (const status of Object.values(c.barStatus)) {
         if (status === c.barStatus.error) {
            continue;
         }
         const result = f.formatErrors([
            {
               fileName: "1) some_archive.zip",
               errorMsg: undefined,
               status: status,
            } as t.WorkerResult,
         ]);
         expect(result).toEqual("");
      }
      let result = f.formatErrors([
         {
            fileName: "1) some_archive.zip",
            errorMsg: "Something Bad Happened",
            status: c.barStatus.error,
         } as t.WorkerResult,
      ]);
      expect(result).toEqual(" 1) some_archive.zip error:\n    ► Something Bad Happened");

      result = f.formatErrors([
         {
            fileName: "1) some_archive.zip",
            errorMsg: undefined,
            status: c.barStatus.error,
         } as t.WorkerResult,
      ]);
      expect(result).toEqual(" 1) some_archive.zip error:\n    ► Unknown error");

      result = f.formatErrors([
         {
            fileName: "some_archive.zip",
            errorMsg: undefined,
            status: c.barStatus.error,
         } as t.WorkerResult,
      ]);
      expect(result).toEqual(" some_archive.zip error:\n ► Unknown error");
   });

   it("should produce appropriate bar formats", () => {
      let result = f.getBarFormat(undefined);
      expect(result).toContain("{unknownPct}");
      result = f.getBarFormat(1234);
      expect(result).toContain("{percentage}");
   });

   it("should produce spinner formatter", () => {
      const barStatus = [c.barStatus.waiting];
      const fmtFn = f.getWormSpinnerBarFormatter(barStatus);
      let result = fmtFn(0, {});
      expect(result).toContain(" ");

      barStatus[0] = c.barStatus.halted;
      result = fmtFn(1, { barsize: 10 });
      expect(result).toEqual("—".repeat(10));
      result = fmtFn(1, { barsize: 10, barIncompleteChar: "*" });
      expect(result).toEqual("*".repeat(10));

      barStatus[0] = c.barStatus.done;
      result = fmtFn(1, { barsize: 10 });
      expect(result).toEqual("■".repeat(10));
      result = fmtFn(1, { barsize: 10, barCompleteChar: "@" });
      expect(result).toEqual("@".repeat(10));
   });
});
