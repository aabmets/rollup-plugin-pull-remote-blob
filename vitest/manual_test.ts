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

import { pullRemoteBlobPlugin } from "../src";

const obj = pullRemoteBlobPlugin({
   haltOnError: false,
   showProgress: true,
   blobs: [
      {
         url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx",
         dest: "./downloads",
         prettyName: "Example of a file",
      },
      {
         url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-recongition-models/wespeaker_en_voxceleb_resnet34.onnx",
         dest: "./downloads",
         prettyName: "Example of a file",
      },
      {
         url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-icefall-en_US-ljspeech-low.tar.bz2",
         dest: "./downloads",
         prettyName: "Example of a file",
      },
      {
         url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/kws-models/sherpa-onnx-kws-zipformer-gigaspeech-3.3M-2024-01-01.tar.bz2",
         dest: "./downloads/extracted",
         prettyName: "Example of decompression",
         decompress: true,
      },
      {
         url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/audio-tagging-models/sherpa-onnx-ced-tiny-audio-tagging-2024-04-19.tar.bz2",
         dest: "./downloads",
         prettyName: "Example of decompression",
         decompress: true,
      },
      {
         url: "https://github.com/microsoft/react-native-windows/archive/refs/heads/main.zip",
         dest: "./downloads",
         prettyName: "Example of unknown filesize",
      },
      {
         url: "https://github.com/k2-fsa/sherpa-onnx/archive/refs/heads/master.zip",
         dest: "./downloads",
         prettyName: "Example of unknown filesize",
      },
   ],
});

await obj.buildStart();
