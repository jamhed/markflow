import * as fs from 'fs/promises';
import Path, { join } from 'path';

import { CodeProcessor } from './code.js';
import { getFileMeta, getFiles, getFolders, makeSlug } from './files.js';
import { getGitMeta } from './git.js';
import { createLinker } from './links.js';
import logger from './logger.js';
import { MetaProcessor, type FolderPart, type Meta } from './meta.js';
import { ProcessorChain, type Processor } from './processor.js';

export interface Content {
  html: string;
  meta: Partial<Meta>;
}

const mapper = (page: any) => page.meta.created_ts;

export async function listPages(path: string) {
  const filteredPaths = (await getFiles(path))
    .filter((file) => file.endsWith('.md'))
    .filter((file) => !Path.basename(file).startsWith('_'));
  const pages = await Promise.all(filteredPaths.map(async (file) => await readMarkdown(file)));
  return pages.sort((a, b) => mapper(b) - mapper(a)).filter((page) => !page.meta.skip);
}

export async function listPagesRecursively(path: string) {
  const filteredPaths = (await getFiles(path, true))
    .filter((file) => file.endsWith('.md'))
    .filter((file) => !Path.basename(file).startsWith('_'));
  const pages = await Promise.all(filteredPaths.map(async (file) => await readMarkdown(file)));
  return pages.sort((a, b) => mapper(b) - mapper(a)).filter((page) => !page.meta.skip);
}

export async function listFolders(path: string) {
  const folderPaths = await getFolders(path);
  const folders = await Promise.all(
    folderPaths.map(async (folder) => await getFolderMeta(path, folder))
  );
  return folders.filter((folder) => !folder.skip);
}

export const makeFolderParts = (slug: string): FolderPart[] => {
  const parts = slug.split('/');
  const re = [];
  let folder = '/';
  for (const part of parts) {
    folder = join(folder, part);
    re.push({ part, folder });
  }
  return re;
};

export async function getFolderMeta(path: string, folder: string) {
  let meta: Partial<Meta> = {};
  try {
    const re = await readMarkdown(Path.join(path, folder, '_index.md'));
    meta = re.meta;
  } catch (e) {
    logger.error(e, 'error reading folder meta');
  }
  const fullPath = Path.join(path, folder);
  return {
    ...{ title: folder, folder, path: fullPath },
    ...meta,
    ...{
      parts: makeFolderParts(
        fullPath
          .replace(/^pages/, '')
          .replace(/^\//, '')
          .replace(/\/$/, '')
      )
    }
  };
}

const processors: any[] = [() => new MetaProcessor(), () => new CodeProcessor()];

export function addProcessor(p: any) {
  processors.push(p);
}

export async function parser(fileName: string, processors: Processor[] = []): Promise<Content> {
  const content = await fs.readFile(fileName, 'utf8');
  const chain = new ProcessorChain(...processors).use(createLinker(Path.dirname(fileName)));
  const html = await chain.parse(content);
  const slug = makeSlug(fileName, 'pages');
  const fileMeta = {
    ...(await getFileMeta(fileName)),
    ...(await getGitMeta(fileName)),
    ...{ slug }
  };
  return { html, meta: { parts: makeFolderParts(slug), ...fileMeta, ...chain.meta } };
}

export async function readMarkdown(fileName: string) {
  return parser(fileName, [new MetaProcessor()]);
}

export async function parseMarkdown(fileName: string) {
  return parser(
    fileName,
    processors.map((p) => p())
  );
}
