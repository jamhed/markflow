import * as fs from 'fs/promises';
import Path from 'path';
import logger from './logger.js';

function split(path: string): string[] {
  const fragments: string[] = [];
  let currentPath = path;

  while (currentPath != '.') {
    const basename = Path.basename(currentPath);
    currentPath = Path.dirname(currentPath);
    fragments.unshift(basename);
  }
  return fragments;
}

export function createLinker(baseDir: string) {
  return {
    hooks: {
      preprocess: async (markdown: string) => {
        const fragments = split(baseDir);
        let currentPath = '';
        for (const fragment of fragments) {
          currentPath = Path.join(currentPath, fragment);
          const linksFile = Path.join(currentPath, '_links.md');
          try {
            const content = await fs.readFile(linksFile, 'utf8');
            markdown += '\n\n' + content;
          } catch (e) {
            logger.debug({ linksFile, e }, "can't read links file, skipping...");
          }
        }
        return markdown;
      }
    }
  };
}
