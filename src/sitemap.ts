import * as fs from 'fs/promises';
import type { DocumentMeta } from './meta.js';
import { SITEMAP_OUTPUT_FILE } from './constants.js';

/**
 * Writes a feed entry to the sitemap JSON file
 * @param url - URL of the entry
 * @param meta - Document metadata
 */
export const writeFeedEntry = async (url: URL, meta: Partial<DocumentMeta>): Promise<void> => {
	await fs.appendFile(
		SITEMAP_OUTPUT_FILE,
		JSON.stringify({
			path_name: url.pathname,
			created_ts: meta.createdTs ?? 0,
			modified_ts: meta.modifiedTs ?? 0,
			title: meta.title,
			description: meta.description
		}) + '\n'
	);
};
