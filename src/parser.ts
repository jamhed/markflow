import Path, { join } from 'path';
import { type Stats } from 'fs';

import { listFolder, makeSlug, readEntryContent, type FSEntry } from './files.js';
import { getGitMeta } from './git.js';
import { MetaProcessor, type PathPart, type DocumentMeta } from './meta.js';
import { ProcessorChain, type Processor } from './processor.js';
import { CodeProcessor } from './code.js';
import { ContentCache } from './cache.js';
import { DEFAULT_PAGES_DIR } from './constants.js';
import logger from './logger.js';

/**
 * Extended metadata for content including custom fields
 */
export interface ContentMeta extends DocumentMeta {
	[key: string]: unknown;
}

/**
 * Represents parsed markdown content with metadata and nested pages
 */
export interface Content {
	readonly html: string;
	readonly meta: ContentMeta;
	readonly pages: Content[];
}

/**
 * Factory function that creates a processor instance
 */
type ProcessorFactory = () => Processor;

/**
 * Global content cache instance
 */
const contentCache = new ContentCache<Content>();

/**
 * Registered processor factories
 */
const processorFactories: ProcessorFactory[] = [
	() => new MetaProcessor(),
	() => new CodeProcessor()
];

/**
 * Extracts created timestamp from content metadata
 */
const getCreatedTimestamp = (content: Content): number => content.meta.createdTs ?? 0;

/**
 * Creates breadcrumb path parts from a slug
 * @param slug - URL slug (e.g., "blog/post-1")
 * @returns Array of path parts with names and paths
 */
export const makePathParts = (slug: string): PathPart[] => {
	const parts = slug.split('/');
	const result: PathPart[] = [];
	let path = '/';

	for (const name of parts) {
		path = join(path, name);
		result.push({ name, path });
	}

	return result;
};

/**
 * Filters and formats file stats for content metadata
 * @param stats - File system stats
 * @returns Formatted metadata object
 */
function filterEntryStats(stats: Stats) {
	return {
		isFolder: stats.isDirectory(),
		createdTs: Math.floor(stats.ctime.getTime() / 1000),
		created: stats.ctime
	};
}

/**
 * Registers a custom processor factory
 * @param factory - Function that creates a processor instance
 */
export function addProcessor(factory: ProcessorFactory): void {
	processorFactories.push(factory);
}

/**
 * Reads content with caching
 * @param entry - File system entry to read
 * @returns Cached or freshly read content
 */
export async function readContentCached(entry: FSEntry): Promise<Content> {
	const cached = contentCache.get(entry.path);
	if (cached) {
		return cached;
	}

	const content = await readContent(entry);
	contentCache.set(entry.path, content);
	return content;
}

/**
 * Clears the content cache
 */
export function clearContentCache(): void {
	contentCache.clear();
}

/**
 * Flattens nested content pages into a single array
 * Uses iterative approach to avoid stack overflow on deep nesting
 * @param entries - Array of content entries
 * @returns Flattened array of all content including nested pages
 */
export function flattenPages(entries: Content[]): Content[] {
	const result: Content[] = [];
	const stack = [...entries];

	while (stack.length > 0) {
		const entry = stack.pop()!;
		result.push(entry);
		if (entry.pages.length > 0) {
			stack.push(...entry.pages);
		}
	}

	return result;
}

/**
 * Lists and parses all content in a directory
 * @param path - Directory path to list
 * @param deep - Whether to deeply load nested pages
 * @param recurse - Whether to recursively process subdirectories
 * @returns Sorted array of parsed content
 */
export async function listContent(
	path: string,
	deep: boolean = false,
	recurse: boolean = false
): Promise<Content[]> {
	logger.info({ path }, 'Listing content');

	const entries = await listFolder(path);
	const filteredPaths = entries
		.filter((entry) => entry.path.endsWith('.md') || entry.stats.isDirectory())
		.filter((entry) => !Path.basename(entry.path).startsWith('_'));

	// Use Promise.allSettled for better error resilience
	const results = await Promise.allSettled(
		filteredPaths.map(async (entry) => await readContent(entry, deep, recurse))
	);

	// Log any failures
	results
		.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
		.forEach((r) => logger.error({ reason: r.reason }, 'Failed to read content entry'));

	// Extract successful results
	const pages = results
		.filter((r): r is PromiseFulfilledResult<Content> => r.status === 'fulfilled')
		.map((r) => r.value)
		.filter((page) => !page.meta.skip)
		.sort((a, b) => getCreatedTimestamp(b) - getCreatedTimestamp(a));

	return pages;
}

/**
 * Reads and parses markdown content from a file system entry
 * @param entry - File system entry to read
 * @param deep - Whether to deeply load nested pages
 * @param recurse - Whether to recursively process subdirectories
 * @returns Parsed content with metadata and nested pages
 */
export async function readContent(
	entry: FSEntry,
	deep: boolean = false,
	recurse: boolean = true
): Promise<Content> {
	logger.info({ path: entry.path }, 'Reading content');

	const content = await readEntryContent(entry);
	const chain = new ProcessorChain(...processorFactories.map((factory) => factory()));
	const html = await chain.parse(content);
	const slug = makeSlug(entry.path, DEFAULT_PAGES_DIR);

	const meta: ContentMeta = {
		...filterEntryStats(entry.stats),
		...(await getGitMeta(entry)),
		slug,
		parts: makePathParts(slug),
		...chain.meta
	};

	const pages =
		(recurse || deep) && entry.stats.isDirectory()
			? await listContent(entry.path, deep, false)
			: [];

	return { html, meta, pages };
}
