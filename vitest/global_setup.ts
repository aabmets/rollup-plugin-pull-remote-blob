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

import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as c from "@src/constants";
import utils from "@src/utils";
import tsConfig from "../tsconfig.json";

async function compileSource() {
   const outDir = tsConfig.compilerOptions.outDir;
   console.info(`Compiling source code to '${outDir}' output directory...`);
   try {
      await promisify(exec)("tsc -p tsconfig.json");
   } catch {
      throw new Error("Failed to compile source code due to TypeScript errors!\n");
   }
   try {
      utils.searchUpwards(c.workerFilePath);
   } catch {
      throw new Error(`Cannot find required file: '${c.workerFilePath}'!\n`);
   }
   console.info("Source code compiled successfully, continuing with testing.\n");
}

export async function setup() {
   await compileSource();
}
