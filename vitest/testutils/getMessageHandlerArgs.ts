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

import type * as t from "@types";
import { vi } from "vitest";

export function getMessageHandlerArgs(args?: {
   messageType: "done" | "error" | "progress" | "decompressing";
   errorIsRaised?: boolean;
   haltOnError?: boolean;
}) {
   return {
      message: {
         type: args?.messageType,
         filesList: ["asdfg"],
         bytes: Buffer.from("qwerty"),
         error: "Fake Error",
      },
      config: {
         haltOnError: !!args?.haltOnError,
      } as t.PluginConfig,
      entry: {
         decompression: {
            filesList: [],
         },
      } as unknown as t.HistoryFileEntry,
      error: {
         isRaised: !!args?.errorIsRaised,
      } as t.Error,
      bar: {
         setStatus: vi.fn(),
         increment: vi.fn(),
      } as unknown as t.BarController,
      terminate: vi.fn(),
   };
}
