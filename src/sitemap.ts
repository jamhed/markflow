import * as fs from 'fs/promises';
import type { Meta } from './meta.js';

export const writeFeedEntry = async (url: URL, meta: Partial<Meta>) => {
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
};
