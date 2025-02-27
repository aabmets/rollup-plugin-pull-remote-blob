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

import type { CustomPlugin, DecompressionOptions, PluginConfig } from "./internal.d.ts";

declare module "rollup-plugin-pull-remote-blob" {
   export function pullRemoteBlobPlugin(config?: PluginConfig): CustomPlugin;
   export type { DecompressionOptions, PluginConfig, CustomPlugin };
}
