import * as fs from 'fs/promises';
import Path from 'path';
import logger from './logger.js';
import { LINKS_FILE } from './constants.js';

/**
 * Splits a path into its component parts
 * @param path - Path to split
 * @returns Array of path fragments from root to leaf
 */
function splitPath(path: string): string[] {
	const fragments: string[] = [];
	let currentPath = path;

	while (currentPath !== '.') {
		const basename = Path.basename(currentPath);
		currentPath = Path.dirname(currentPath);
		fragments.unshift(basename);
	}

	return fragments;
}

/**
 * Creates a Marked linker extension that includes link reference files
 * Walks up the directory tree and includes all _links.md files
 * @param baseDir - Base directory to start from
 * @returns Marked extension with preprocess hook
 */
export function createLinker(baseDir: string) {
	return {
		hooks: {
			preprocess: async (markdown: string): Promise<string> => {
				const pathFragments = splitPath(baseDir);
				let currentPath = '';
				let combinedMarkdown = markdown;

				for (const fragment of pathFragments) {
					currentPath = Path.join(currentPath, fragment);
					const linksFilePath = Path.join(currentPath, LINKS_FILE);

					try {
						const linksContent = await fs.readFile(linksFilePath, 'utf8');
						combinedMarkdown += '\n\n' + linksContent;
					} catch (error) {
						logger.debug({ linksFile: linksFilePath, error }, 'Links file not found, skipping');
					}
				}

				return combinedMarkdown;
			}
		}
	};
}
