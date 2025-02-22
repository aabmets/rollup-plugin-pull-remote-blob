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

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
   test: {
      globalSetup: "./vitest/global_setup.ts",
      include: ["vitest/tests/**/*"],
      server: {
         deps: {
            external: ["typescript"],
         },
      },
   },
   resolve: {
      alias: {
         "@src": path.resolve(__dirname, "./src"),
         "@types": path.resolve(__dirname, "./types/internal.d.ts"),
      },
   },
});
