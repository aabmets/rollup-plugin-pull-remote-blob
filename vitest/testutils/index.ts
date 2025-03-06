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

import crypto from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";

export function getTempDirPath() {
   const randString = crypto.randomBytes(8).toString("hex");
   return path.join(tmpdir(), "vitest", randString);
}
