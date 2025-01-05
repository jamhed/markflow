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

export async function readContentCached(entry: FSEntry): Promise<Content> {
  const cacheKey = entry.path;
  if (cacheStore[cacheKey]) {
    return cacheStore[cacheKey];
  }
  cacheStore[cacheKey] = await readContent(entry);
  return cacheStore[cacheKey];
}

export function flattenPages(entries: Content[]): Content[] {
  const re: Content[] = [];
  for (const entry of entries) {
    re.push(entry);
    for (const page of entry.pages) {
      re.push(page);
      re.push(...flattenPages(page.pages));
    }
  }
  return re;
}

export async function listContent(path: string, deep: boolean = false, recurse: boolean = false) {
  logger.info({ path }, 'listing content');
  const filteredPaths = (await listFolder(path))
    .filter((entry) => entry.path.endsWith('.md') || entry.stats.isDirectory())
    .filter((entry) => !Path.basename(entry.path).startsWith('_'));
  const pages = await Promise.all(
    filteredPaths.map(async (entry) => await readContent(entry, deep, recurse))
  );
  return pages.sort((a, b) => createdTs(b) - createdTs(a)).filter((page) => !page.meta.skip);
}

export async function readContent(
  entry: FSEntry,
  deep: boolean = false,
  recurse: boolean = true
): Promise<Content> {
  logger.info({ path: entry.path }, 'reading content');
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
  const pages =
    (recurse || deep) && entry.stats.isDirectory()
      ? await listContent(entry.path, deep, false)
      : [];
  return { html, meta, pages };
}
