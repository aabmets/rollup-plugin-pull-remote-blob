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

import * as c from "@src/constants";
import * as d from "@src/downloader";
import * as u from "@testutils";
import type * as t from "@types";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("setRemoteFileSizeBytes", () => {
   afterEach(vi.restoreAllMocks);

   it("should use the provided sizeBytes if present", async () => {
      const [headSpy, procRet] = u.setupAxiosHeadTest({ sizeBytes: 123 });
      await d.setRemoteFileSizeBytes(procRet);

      expect(headSpy).not.toHaveBeenCalled();
      expect(procRet.option.sizeBytes).toBe(123);
   });

   it("should fetch sizeBytes with axios.head request when not provided", async () => {
      const [headSpy, procRet] = u.setupAxiosHeadTest({ contentLength: 456 });
      await d.setRemoteFileSizeBytes(procRet);

      expect(headSpy).toHaveBeenCalledWith(procRet.option.url);
      expect(procRet.option.sizeBytes).toBe(456);
   });

   it("should leave sizeBytes undefined if axios.head does not return content-length", async () => {
      const [headSpy, procRet] = u.setupAxiosHeadTest();
      await d.setRemoteFileSizeBytes(procRet);

      expect(headSpy).toHaveBeenCalledWith(procRet.option.url);
      expect(procRet.option.sizeBytes).toBeUndefined();
   });

   it("should set errorMsg if axios.head throws an error", async () => {
      const [headSpy, procRet] = u.setupAxiosHeadTest({ throwError: "Network Error" });
      await d.setRemoteFileSizeBytes(procRet);

      expect(headSpy).toHaveBeenCalledWith(procRet.option.url);
      expect(procRet.errorMsg).toBe("Network Error");
      expect(procRet.option.sizeBytes).toBeUndefined();
   });
});

describe("handleWorkerMessage", () => {
   afterEach(vi.restoreAllMocks);

   it("should terminate with done when message type is done", () => {
      const args = u.getMessageHandlerArgs({ messageType: "done" });
      d.handleWorkerMessage(args as t.MessageHandlerArgs);

      expect(args.terminate).toHaveBeenCalledWith(c.barStatus.done);
      const tgt = args.entry.decompression.filesList;
      const src = args.message.filesList;
      expect(tgt).toEqual(src);
   });

   it("should terminate with error when message type is error", () => {
      const args = u.getMessageHandlerArgs({ messageType: "error" });
      d.handleWorkerMessage(args as t.MessageHandlerArgs);

      expect(args.terminate).toHaveBeenCalledWith(c.barStatus.error, args.message.error);
   });

   it("should terminate with halted when error has been raised and haltOnError is true", () => {
      const args = u.getMessageHandlerArgs({
         messageType: "progress",
         haltOnError: true,
         errorIsRaised: true,
      });
      d.handleWorkerMessage(args as t.MessageHandlerArgs);

      expect(args.terminate).toHaveBeenCalledWith(c.barStatus.halted);
   });

   it("should log progress when error has been raised and haltOnError is false", () => {
      const args = u.getMessageHandlerArgs({
         messageType: "progress",
         haltOnError: false,
         errorIsRaised: true,
      });
      d.handleWorkerMessage(args as t.MessageHandlerArgs);

      expect(args.bar.setStatus).toHaveBeenCalledWith(c.barStatus.downloading);
      expect(args.bar.increment).toHaveBeenCalledWith(args.message.bytes);
   });

   it("should log progress when errors have not been raised", () => {
      const args = u.getMessageHandlerArgs({ messageType: "progress" });
      d.handleWorkerMessage(args as t.MessageHandlerArgs);

      expect(args.bar.setStatus).toHaveBeenCalledWith(c.barStatus.downloading);
      expect(args.bar.increment).toHaveBeenCalledWith(args.message.bytes);
   });

   it("should set bar status to decompressing when message type is decompressing", () => {
      const args = u.getMessageHandlerArgs({ messageType: "decompressing" });
      d.handleWorkerMessage(args as t.MessageHandlerArgs);

      expect(args.bar.setStatus).toHaveBeenCalledWith(c.barStatus.decompressing);
   });
});
