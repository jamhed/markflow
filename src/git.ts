import * as fs from 'fs/promises';
import Path from 'path';
import git, { type ReadCommitResult } from 'isomorphic-git';
import logger from './logger.js';
import type { FolderEntryMeta } from './meta.js';
import type { FSEntry } from './files.js';

/**
 * Logs a warning for git-related errors
 * @param error - The error that occurred
 * @param message - Context message
 */
function logGitError(error: Error, message: string): void {
	logger.warn({
		msg: message,
		errorName: error.name,
		errorMessage: error.message
	});
}

/**
 * Retrieves git metadata for a file system entry
 * Extracts creation date, modification date, and author from git history
 * @param entry - File system entry to get git metadata for
 * @returns Folder entry metadata enriched with git information
 */
export async function getGitMeta(entry: FSEntry): Promise<FolderEntryMeta> {
	const path = Path.dirname(entry.path);
	const meta: FolderEntryMeta = {
		name: entry.path,
		path,
		isFolder: entry.stats.isDirectory()
	};

	let commits: ReadCommitResult[];

	try {
		commits = await git.log({ fs, dir: '.', filepath: entry.path });
	} catch (error: unknown) {
		logGitError(error as Error, 'Failed to retrieve git history');
		return meta;
	}

	// No commits found
	if (commits.length === 0) {
		return meta;
	}

	// Get the oldest commit (creation)
	const firstCommit = commits[commits.length - 1];
	if (firstCommit) {
		meta.created = new Date(firstCommit.commit.author.timestamp * 1000).toUTCString();
		meta.createdTs = firstCommit.commit.author.timestamp;
		meta.author = firstCommit.commit.author.name;
	}

	// Get the most recent commit (modification)
	if (commits.length > 1) {
		const lastCommit = commits[0];
		if (lastCommit) {
			meta.modified = new Date(lastCommit.commit.author.timestamp * 1000).toUTCString();
			meta.modifiedTs = lastCommit.commit.author.timestamp;
		}
	}

	return meta;
}
