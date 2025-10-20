import { Feed } from 'feed';
import * as fs from 'fs/promises';
import { SitemapStream, streamToPromise } from 'sitemap';
import { readContent } from './parser.js';
import { getEntry } from './files.js';
import { DEFAULT_PAGES_DIR } from './constants.js';

/**
 * Interface for sitemap entry metadata (matches the JSON format)
 */
interface SitemapEntryMeta {
	path_name: string;
	created_ts: number;
	modified_ts: number;
	title: string;
	description?: string;
}

/**
 * Creates an RSS feed from a sitemap JSON file
 * @param baseUrl - Base URL of the site
 * @param entryFile - Path to the sitemap JSON file
 * @param rootDir - Root directory for content (default: 'pages')
 * @returns Configured Feed instance
 */
export const makeFeed = async (
	baseUrl: string,
	entryFile: string,
	rootDir: string = DEFAULT_PAGES_DIR
): Promise<Feed> => {
	const entry = await getEntry(rootDir);
	const root = await readContent(entry);

	const feed = new Feed({
		id: baseUrl,
		title: root.meta.title ?? root.meta.name,
		link: baseUrl,
		description: root.meta.description,
		copyright: 'All rights reserved'
	});

	const fileContent = await fs.readFile(entryFile, 'utf8');
	const lines = fileContent.split(/\r?\n/);

	for (const line of lines) {
		if (line.length === 0) continue;

		try {
			const meta = JSON.parse(line) as SitemapEntryMeta;
			feed.addItem({
				link: baseUrl + meta.path_name,
				date: new Date(Math.max(meta.created_ts, meta.modified_ts) * 1000),
				title: meta.title,
				description: meta.description
			});
		} catch (_error) {
			// Skip malformed lines
			continue;
		}
	}

	return feed;
};

/**
 * Creates a sitemap from a sitemap JSON file
 * @param baseUrl - Base URL of the site
 * @param entryFile - Path to the sitemap JSON file
 * @returns Promise resolving to sitemap buffer
 */
export const makeSitemap = async (baseUrl: string, entryFile: string): Promise<Buffer> => {
	const stream = new SitemapStream({ hostname: baseUrl });
	const fileContent = await fs.readFile(entryFile, 'utf8');
	const lines = fileContent.split(/\r?\n/);

	for (const line of lines) {
		if (line.length === 0) continue;

		try {
			const meta = JSON.parse(line) as SitemapEntryMeta;
			stream.write({
				url: baseUrl + meta.path_name,
				lastmod: new Date(Math.max(meta.created_ts, meta.modified_ts) * 1000)
			});
		} catch (_error) {
			// Skip malformed lines
			continue;
		}
	}

	stream.end();
	return streamToPromise(stream);
};
