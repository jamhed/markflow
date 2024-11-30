import { Feed } from 'feed';
import * as fs from 'fs/promises';
import { SitemapStream, streamToPromise } from 'sitemap';
import { getFolderMeta } from './parser.js';

export const makeFeed = async (baseUrl: string, entryFile: string): Promise<Feed> => {
  const rootMeta = await getFolderMeta('pages', '');

  const feed = new Feed({
    id: baseUrl,
    title: rootMeta.title,
    link: baseUrl,
    description: rootMeta.description,
    copyright: 'All rights reserved'
  });
  const re = await fs.readFile(entryFile, 'utf8');
  for (const line of re.split(/\r?\n/)) {
    if (line.length == 0) continue;
    const meta = JSON.parse(line);
    feed.addItem({
      link: baseUrl + meta.path_name,
      date: new Date(Math.max(meta.created_ts, meta.modified_ts) * 1000),
      title: meta.title,
      description: meta.description
    });
  }
  return feed;
};

export const makeSitemap = async (baseUrl: string, entryFile: string) => {
  const stream = new SitemapStream({ hostname: baseUrl });
  const re = await fs.readFile(entryFile, 'utf8');
  for (const line of re.split(/\r?\n/)) {
    if (line.length == 0) continue;
    const meta = JSON.parse(line);
    stream.write({
      url: baseUrl + meta.path_name,
      lastmod: new Date(Math.max(meta.created_ts, meta.modified_ts) * 1000)
    });
  }
  stream.end();
  return streamToPromise(stream);
};
