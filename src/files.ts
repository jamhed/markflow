import * as fs from 'fs/promises';
import Path from 'path';
import logger from './logger.js';

export async function getFileMeta(filePath: string) {
  const stats = await fs.stat(filePath);
  return { created_ts: Math.floor(stats.ctime.getTime() / 1000), created: stats.ctime };
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

export async function getFiles(path: string, recursive: boolean = false) {
  const files: string[] = [];
  try {
    const pathFiles = await fs.readdir(path);
    for (const file of pathFiles) {
      const fullPath = Path.join(path, file);
      const stats = await fs.stat(fullPath);
      if (recursive && stats.isDirectory()) {
        const subFiles = await getFiles(fullPath, recursive);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }
  } catch (e) {
    logger.error(e, 'getFiles');
  }
  return files;
}

export async function getFolders(path: string) {
  try {
    const folders: string[] = [];
    const pathFiles = await fs.readdir(path);
    for (const name of pathFiles) {
      const fullPath = Path.join(path, name);
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) folders.push(name);
    }
    return folders;
  } catch (e) {
    logger.error(e, 'getFolders');
    return [];
  }
}
