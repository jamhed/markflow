import * as fs from 'fs/promises';
import Path from 'path';
import logger from './logger.js';
import { existsSync, type Stats } from 'fs';
import { DEFAULT_INDEX_FILE } from './constants.js';

/**
 * Represents a file system entry with its metadata
 */
export interface FSEntry {
	readonly path: string;
	readonly stats: Stats;
}

/**
 * Loads and parses a JSON file
 * @param path - Path to the JSON file
 * @returns Parsed JSON content
 * @throws Error if file cannot be read or parsed
 */
export async function loadJSON<T = unknown>(path: string): Promise<T> {
	const content = await fs.readFile(path, 'utf8');
	return JSON.parse(content) as T;
}

/**
 * Creates a URL-friendly slug from a file path
 * @param filePath - Full path to the file
 * @param baseDir - Base directory to make path relative to
 * @returns URL slug without file extension
 */
export function makeSlug(filePath: string, baseDir: string): string {
	const relativePath = Path.relative(baseDir, filePath);
	const slug = relativePath.replace(Path.extname(relativePath), '');
	return slug;
}

/**
 * Gets file system entry information for a path
 * @param path - Path to file or directory
 * @returns FSEntry with path and stats
 * @throws Error if path does not exist
 */
export async function getEntry(path: string): Promise<FSEntry> {
	const stats = await fs.stat(path);
	return { path, stats };
}

/**
 * Reads content from a file system entry
 * For directories, reads the index file; for files, reads the file itself
 * @param entry - File system entry to read
 * @returns File content as string, or empty string if file doesn't exist
 */
export async function readEntryContent(entry: FSEntry): Promise<string> {
	const path = entry.stats.isDirectory() ? Path.join(entry.path, DEFAULT_INDEX_FILE) : entry.path;
	return existsSync(path) ? await fs.readFile(path, 'utf8') : '';
}

/**
 * Lists all entries in a folder
 * @param path - Path to the folder
 * @param recursive - Whether to recursively list subdirectories
 * @returns Array of file system entries
 * @throws Error if folder cannot be read
 */
export async function listFolder(path: string, recursive: boolean = false): Promise<FSEntry[]> {
	const entries: FSEntry[] = [];
	try {
		const pathFiles = await fs.readdir(path);
		for (const file of pathFiles) {
			const fullPath = Path.join(path, file);
			const stats = await fs.stat(fullPath);

			if (recursive && stats.isDirectory()) {
				const subEntries = await listFolder(fullPath, recursive);
				entries.push(...subEntries);
			} else {
				entries.push({ path: fullPath, stats });
			}
		}
	} catch (error) {
		logger.error({ error, path }, 'Failed to list folder');
		throw new Error(`Failed to list folder ${path}: ${error}`);
	}
	return entries;
}
