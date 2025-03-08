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
import * as p from "@src/progress";
import * as u from "@testutils";
import type * as t from "@types";
import ansis from "ansis";
import cp from "cli-progress";
import { assert, func, object, optional, string } from "superstruct";
import { describe, expect, it } from "vitest";

describe("spinners", () => {
   it("should generate crawling progress bar", () => {
      const spinner = p.wormSpinnerGenerator();

      const bar1 = spinner.next().value;
      expect(typeof bar1).toEqual("string");
      expect(bar1?.length).toEqual(c.progressBarWidth);

      const bar2 = spinner.next().value;
      expect(typeof bar2).toEqual("string");
      expect(bar2?.length).toEqual(c.progressBarWidth);

      expect(bar1 === bar2).toEqual(false);
   });
});

describe("formatters", () => {
   it("should get file name", () => {
      const [procRet1, procRet2] = u.getMustDownload("Test File", undefined);

      let result = p.getFileName(procRet1, 0);
      result = ansis.strip(result);
      expect(result).toEqual("1) Test File");

      result = p.getFileName(procRet2, 9);
      result = ansis.strip(result);
      expect(result).toEqual("10) shortername.txt");
   });

   it("should compute clamped file name length", () => {
      const mustDownload1 = u.getMustDownload(undefined, undefined);
      let result = p.clampedFileNameLength(mustDownload1);
      expect(result).toEqual("1) longerfilename.txt".length);

      const mustDownload2 = u.getMustDownload(undefined, "Even longer shorter name override");
      result = p.clampedFileNameLength(mustDownload2);
      expect(result).toEqual(c.fileNameMaxDisplayLength);

      const mustDownload3 = u.getMustDownload("asd", "qwe");
      result = p.clampedFileNameLength(mustDownload3);
      expect(result).toEqual(c.fileNameMinDisplayLength);
   });

   it("should format file name", () => {
      const mustDownload = u.getMustDownload("qwe", "Even longer shorter name override");
      let result = p.formatFileName(mustDownload, 0);
      result = ansis.strip(result);
      expect(result).toEqual("1) qwe".padEnd(c.fileNameMaxDisplayLength));
      result = p.formatFileName(mustDownload, 1);
      result = ansis.strip(result);
      expect(result).toEqual("2) Even longer shorter name o…");
   });

   it("should format file size", () => {
      let result = p.formatFileSize(undefined);
      expect(result).toEqual("   ??? B  ");

      result = p.formatFileSize(1023);
      expect(result).toEqual("  1023 B  ");

      result = p.formatFileSize(1024);
      expect(result).toEqual("   1.0 KiB");

      result = p.formatFileSize(1536);
      expect(result).toEqual("   1.5 KiB");

      result = p.formatFileSize(1024 ** 2 - 1);
      expect(result).toEqual("1024.0 KiB");

      result = p.formatFileSize(1024 ** 2);
      expect(result).toEqual("   1.0 MiB");

      result = p.formatFileSize(1024 ** 3 - 1);
      expect(result).toEqual("1024.0 MiB");

      result = p.formatFileSize(1024 ** 3);
      expect(result).toEqual("   1.0 GiB");

      result = p.formatFileSize(1024 ** 4 - 1);
      expect(result).toEqual("1024.0 GiB");
   });

   it("should format status", () => {
      for (const status of Object.values(c.barStatus)) {
         let result = p.formatStatus(status);
         result = ansis.strip(result);
         expect(result).toEqual(status.text.padEnd(c.maxBarStatusTextLength));
      }
   });

   it("should format errors", () => {
      for (const status of Object.values(c.barStatus)) {
         if (status === c.barStatus.error) {
            continue;
         }
         let result = p.formatErrors([
            {
               fileName: "1) some_archive.zip",
               errorMsg: undefined,
               status: status,
            } as t.WorkerResult,
         ]);
         result = ansis.strip(result);
         expect(result).toEqual("");
      }
      let result = p.formatErrors([
         {
            fileName: "1) some_archive.zip",
            errorMsg: "Something Bad Happened",
            status: c.barStatus.error,
         } as t.WorkerResult,
      ]);
      result = ansis.strip(result);
      expect(result).toEqual(" 1) some_archive.zip error:\n    ► Something Bad Happened");

      result = p.formatErrors([
         {
            fileName: "1) some_archive.zip",
            errorMsg: undefined,
            status: c.barStatus.error,
         } as t.WorkerResult,
      ]);
      result = ansis.strip(result);
      expect(result).toEqual(" 1) some_archive.zip error:\n    ► Unknown error");

      result = p.formatErrors([
         {
            fileName: "some_archive.zip",
            errorMsg: undefined,
            status: c.barStatus.error,
         } as t.WorkerResult,
      ]);
      result = ansis.strip(result);
      expect(result).toEqual(" some_archive.zip error:\n ► Unknown error");
   });

   it("should produce appropriate bar formats", () => {
      let result = p.getBarFormat(undefined);
      expect(result).toContain("{unknownPct}");
      result = p.getBarFormat(1234);
      expect(result).toContain("{percentage}");
   });

   it("should produce spinner formatter", () => {
      const barStatus = [c.barStatus.waiting];
      const fmtFn = p.getWormSpinnerBarFormatter(barStatus);
      let result = fmtFn(0, {});
      expect(result).toContain(" ");

      barStatus[0] = c.barStatus.halted;
      result = fmtFn(1, { barsize: 10 });
      result = ansis.strip(result);
      expect(result).toEqual("—".repeat(10));

      result = fmtFn(1, { barsize: 10, barIncompleteChar: "*" });
      result = ansis.strip(result);
      expect(result).toEqual("*".repeat(10));

      barStatus[0] = c.barStatus.done;
      result = fmtFn(1, { barsize: 10 });
      result = ansis.strip(result);
      expect(result).toEqual("■".repeat(10));

      result = fmtFn(1, { barsize: 10, barCompleteChar: "@" });
      result = ansis.strip(result);
      expect(result).toEqual("@".repeat(10));
   });
});

describe("table", () => {
   const labels = [
      "Index – File name",
      "File size – Progress bar – Percent complete",
      "ETA",
      "Elapsed",
      "Status",
   ];

   it("should generate expected labels", () => {
      const result = p.getLabels(u.getMustDownload());
      for (const label of labels) {
         expect(result.join("")).toContain(label);
      }
   });

   it("should generate expected header", () => {
      let result = p.getTableHeader(u.getMustDownload());
      result = ansis.strip(result);
      for (const char of "┌┬┐│├┼┤─") {
         expect(result).toContain(char);
      }
      for (const label of labels) {
         expect(result).toContain(label);
      }
   });

   it("should generate expected footer", () => {
      let result = p.getTableFooter(u.getMustDownload());
      result = ansis.strip(result);
      for (const char of "└┴┘─") {
         expect(result).toContain(char);
      }
   });
});

describe("bars", () => {
   it("should return expected bar payload object", () => {
      const BarPayloadStruct = object({
         unknownPct: optional(string()),
         fileSize: string(),
         fileName: string(),
         status: string(),
      });
      const result = p.getBarPayload("asdfg.txt", 3456000);
      assert(result, BarPayloadStruct);
   });

   it("should return expected bar options object", () => {
      const BarOptionsStruct = object({
         format: string(),
         formatTime: func(),
         formatBar: optional(func()),
         barGlue: optional(string()),
      });
      let result = p.getBarOptions([c.barStatus.done], undefined);
      assert(result, BarOptionsStruct);
      expect(result.formatBar).toBeInstanceOf(Function);
      expect(result.barGlue).toBeUndefined();

      result = p.getBarOptions([c.barStatus.done], 3456000);
      assert(result, BarOptionsStruct);
      expect(result.formatBar).toBeUndefined();
      expect(result.formatTime).toBeInstanceOf(Function);
      expect(typeof result.barGlue).toEqual("string");
      const fmtTime = result.formatTime(1000, { autopaddingChar: "" }, 2);
      expect(fmtTime).toContain("16m40s");
   });

   it("should return expected bar controller object", () => {
      const BarControllerStruct = object({
         fileName: string(),
         isError: func(),
         setStatus: func(),
         increment: func(),
         stop: func(),
         bar: optional(object()),
      });
      const args = {
         fileName: "somefile.txt",
         sizeBytes: 1000000,
         showProgress: true,
         multiBar: new cp.MultiBar({
            barsize: c.progressBarWidth,
            clearOnComplete: false,
            barCompleteChar: "■",
            barIncompleteChar: "—",
            autopadding: true,
            hideCursor: true,
         }),
      };
      let ctrl = p.getDisabledController(args);
      assert(ctrl, BarControllerStruct);
      ctrl.setStatus(c.barStatus.error);
      expect(ctrl.isError()).toEqual(false);
      expect(ctrl.increment(1)).toEqual(null);
      expect(ctrl.stop()).toEqual(null);
      expect(ctrl.bar).toBeUndefined();

      ctrl = p.getController(args);
      assert(ctrl, BarControllerStruct);
      ctrl.setStatus(c.barStatus.error);
      expect(ctrl.isError()).toEqual(true);

      expect(typeof ctrl.bar).toEqual("object");
      if (typeof ctrl.bar === "object") {
         const bar = ctrl.bar;
         bar.start(args.sizeBytes, 0);

         expect(bar.getProgress()).toEqual(0);
         ctrl.increment(1234);
         expect(bar.getProgress() * 1000000).toEqual(1234);

         expect(bar.isActive).toEqual(true);
         ctrl.stop();
         expect(bar.isActive).toEqual(false);
      }

      ctrl = p.getController({ ...args, sizeBytes: undefined });
      assert(ctrl, BarControllerStruct);

      expect(typeof ctrl.bar).toEqual("object");
      if (typeof ctrl.bar === "object") {
         const bar = ctrl.bar;
         bar.start(0, -1);

         expect(bar.getProgress()).toEqual(0);
         ctrl.increment(1234);
         expect(bar.getProgress()).toEqual(0);

         expect(bar.isActive).toEqual(true);
         ctrl.stop();
         expect(bar.isActive).toEqual(false);
         expect(bar.getProgress()).toEqual(1);

         ctrl.setStatus(c.barStatus.done);
         ctrl.stop();
         expect(bar.getProgress()).toEqual(1);
      }
   });

   it("should return expected progress bars", () => {
      const md = u.getMustDownload();
      let ret = p.getProgressBars({
         config: { blobs: [], showProgress: false },
         mustDownload: md,
      });
      Object.entries(ret.progBarMap).forEach(([key, ctrl], index) => {
         expect(key).toEqual(md[index].entry.blobOptionsDigest);
         expect(ctrl.bar).toBeUndefined();
      });
      ret = p.getProgressBars({
         config: { blobs: [], showProgress: true },
         mustDownload: md,
      });
      Object.entries(ret.progBarMap).forEach(([key, ctrl], index) => {
         expect(key).toEqual(md[index].entry.blobOptionsDigest);
         expect(typeof ctrl.bar).toEqual("object");
      });
   });
});
