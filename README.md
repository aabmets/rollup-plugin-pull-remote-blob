# rollup-plugin-pull-remote-blob

## Overview

`rollup-plugin-pull-remote-blob` is a Rollup plugin designed to download remote files (blobs) during the build process. 
It allows you to specify remote resources, manage caching, and handle decompression of downloaded files. 
This plugin is ideal for scenarios where assets need to be dynamically fetched and processed during a build.

## Features

- **Download Remote Files:** Specify URLs to download resources and save them to a local destination.
- **Decompression Support:** Automatically decompress downloaded files using popular decompression options.
- **Caching:** Avoid redundant downloads by checking existing local files and verifying their integrity.
- **Flexible Configuration:** Define when and how remote files are fetched, including custom decompression behavior.

## Installation

```bash
npm install rollup-plugin-pull-remote-blob --save-dev
```
```bash
bun add rollup-plugin-pull-remote-blob --dev
```

## Usage
You can configure the plugin to download files as part of your Rollup build configuration. 
This plugin can be used with or without TypeScript; the types are handled automatically.
Here is a basic example of how to use rollup-plugin-pull-remote-blob in your Rollup configuration:

```typescript
import { rollup } from 'rollup';
import { pullRemoteBlobPlugin } from 'rollup-plugin-pull-remote-blob';
import type { RemoteBlobOption, DecompressOptions, ArchivedFile } from 'rollup-plugin-pull-remote-blob';

rollup({
   input: 'src/index.js',
   plugins: [
      pullRemoteBlobPlugin([
         {
            url: 'https://example.com/data.json',
            dest: './dist/data.json',  // relative paths are supported
            alwaysPull: true  // useful for when the remote file contents are guaranteed to change
         }, {
            url: 'https://example.com/some-asset.zip',
            dest: 'C:/Projects/my_project/dist/assets',  // absolute paths are also supported
            decompress: true  // the files are extracted into the structure they have in the archive
         }, {
            url: 'https://example.com/some-asset.zip',
            dest: './dist/assets.zip',  // will raise an error; path must be a directory when decompressing
            decompress: {
               filter: (  // extract only those files for which the filter function returns true
                  (file: ArchivedFile) => file.path.includes('data.json')
               ),
               strip: 3  // flatten the file structure when decompressing the archive by amount levels
            }
         }
      ])
   ]
}).then(bundle => {
  // Output options...
});
```

## Configuration Options
* url (string) - The URL of the remote file to download.
* dest (string) - The local destination where the file will be saved.
* alwaysPull (boolean) - Optional. If true, the file will be downloaded every time regardless of its existence. Default is false.
* decompress (boolean | DecompressOptions) - Optional. If true, the plugin will attempt to decompress the downloaded file. Can also specify an object with decompression options.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
