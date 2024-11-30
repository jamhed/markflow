import * as fs from 'fs/promises';
import type { Meta } from './meta.js';

let building = false;

export const writeFeedEntry = async (url: URL, meta: Partial<Meta>) => {
  if (building) {
    fs.appendFile(
      '.svelte-kit/output/client/sitemap.json',
      JSON.stringify({
        path_name: url.pathname,
        created_ts: meta.created_ts || 0,
        modified_ts: meta.modified_ts || 0,
        title: meta.title,
        description: meta.description
      }) + '\n'
    );
  }
};
