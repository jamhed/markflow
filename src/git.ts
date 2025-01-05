import * as fs from 'fs/promises';
import Path from 'path';
import git, { type ReadCommitResult } from 'isomorphic-git';
import logger from './logger.js';
import type { FolderEntryMeta } from './meta.js';
import type { FSEntry } from './files.js';

function warnError(e: Error, message: string) {
  logger.warn({ msg: message, error: e.name, message: e.message });
}

export async function getGitMeta(entry: FSEntry) {
  const path = Path.dirname(entry.path);
  const meta: FolderEntryMeta = { name: entry.path, path, isFolder: entry.stats.isDirectory() };
  let commits: ReadCommitResult[];
  try {
    commits = await git.log({ fs, dir: '.', filepath: entry.path });
  } catch (e: unknown) {
    warnError(e as Error, 'error getting git info');
    return meta;
  }
  if (commits.length > 0) {
    const first = commits.pop();
    if (first) {
      meta.created = new Date(first.commit.author.timestamp * 1000).toUTCString();
      meta.created_ts = first.commit.author.timestamp;
      meta.author = first.commit.author.name;
    }
  }
  if (commits.length > 0) {
    const last = commits.shift();
    if (last) {
      meta.modified = new Date(last.commit.author.timestamp * 1000).toUTCString();
      meta.modified_ts = last.commit.author.timestamp;
    }
  }
  return meta;
}
