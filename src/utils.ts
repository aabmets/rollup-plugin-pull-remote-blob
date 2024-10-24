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

import crypto from "node:crypto";

function digestString(data: string): string {
   const hash = crypto.createHash("sha256");
   const digest = hash.update(data).digest("hex");
   return digest.substring(0, 32);
}

export default { digestString };
