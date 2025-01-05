import Path, { join } from 'path';

import { listFolder, makeSlug, readEntryContent, type FSEntry } from './files.js';
import { getGitMeta } from './git.js';
import { MetaProcessor, type PathPart, type DocumentMeta } from './meta.js';
import { ProcessorChain } from './processor.js';
import { type Stats } from 'fs';
import { CodeProcessor } from './code.js';
import logger from './logger.js';

const cacheStore: { [key: string]: Content } = {};

export interface ContentMeta extends DocumentMeta {
  [key: string]: any;
}

export interface Content {
  html: string;
  meta: ContentMeta;
  pages: Content[];
}

const createdTs = (page: any) => page.meta.created_ts;

export const makePathParts = (slug: string): PathPart[] => {
  const parts = slug.split('/');
  const re = [];
  let path = '/';
  for (const name of parts) {
    path = join(path, name);
    re.push({ name, path });
  }
  return re;
};

function filterEntryStats(stats: Stats) {
  return {
    isFolder: stats.isDirectory(),
    created_ts: Math.floor(stats.ctime.getTime() / 1000),
    created: stats.ctime
  };
}

const processors: any[] = [() => new MetaProcessor(), () => new CodeProcessor()];

export function addProcessor(p: any) {
  processors.push(p);
}

export async function listContent(path: string, recursive: boolean = false) {
  const filteredPaths = (await listFolder(path, recursive))
    .filter((entry) => entry.path.endsWith('.md') || entry.stats.isDirectory())
    .filter((entry) => !Path.basename(entry.path).startsWith('_'));
  const pages = await Promise.all(filteredPaths.map(async (entry) => await readContent(entry)));
  return pages.sort((a, b) => createdTs(b) - createdTs(a)).filter((page) => !page.meta.skip);
}

export async function readContent(entry: FSEntry, recursive: boolean = false): Promise<Content> {
  if (cacheStore[entry.path]) {
    return cacheStore[entry.path];
  }
  logger.info({ path: entry.path }, 'reading');
  const content = await readEntryContent(entry);
  const chain = new ProcessorChain(...processors.map((p) => p()));
  const html = await chain.parse(content);
  const slug = makeSlug(entry.path, 'pages');
  const meta = {
    ...filterEntryStats(entry.stats),
    ...(await getGitMeta(entry)),
    ...{ slug },
    parts: makePathParts(slug),
    ...chain.meta
  };
  const pages = entry.stats.isDirectory() ? await listContent(entry.path, recursive) : [];
  const re = { html, meta, pages };
  cacheStore[entry.path] = re;
  return re;
}
