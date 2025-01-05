import * as fs from 'fs/promises';
import Path from 'path';
import logger from './logger.js';
import { existsSync, type Stats } from 'fs';

export interface FSEntry {
  path: string;
  stats: Stats;
}

export async function loadJSON(path: string) {
  const content = await fs.readFile(path, 'utf8');
  return JSON.parse(content);
}

export function makeSlug(filePath: string, baseDir: string): string {
  const relativePath = Path.relative(baseDir, filePath);
  const slug = relativePath.replace(Path.extname(relativePath), '');
  return slug;
}

export async function getEntry(path: string) {
  const stats = await fs.stat(path);
  return { path, stats };
}

export async function readEntryContent(entry: FSEntry) {
  const path = entry.stats.isDirectory() ? Path.join(entry.path, '_index.md') : entry.path;
  return existsSync(path) ? await fs.readFile(path, 'utf8') : '';
}

export async function listFolder(path: string, recursive: boolean = false) {
  const entries: FSEntry[] = [];
  try {
    const pathFiles = await fs.readdir(path);
    for (const file of pathFiles) {
      const fullPath = Path.join(path, file);
      const stats = await fs.stat(fullPath);
      if (recursive && stats.isDirectory()) {
        const subEntries = await listFolder(fullPath, recursive);
        entries.push(...subEntries);
      }
      entries.push({ path: fullPath, stats });
    }
  } catch (e) {
    logger.error(e, 'listFolder');
  }
  return entries;
}
