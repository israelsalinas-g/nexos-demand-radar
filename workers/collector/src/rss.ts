import Parser from "rss-parser";

const parser = new Parser();

export interface RssItem {
  guid?: string;
  id?: string;
  link?: string;
  title?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
  isoDate?: string;
}

export async function fetchRssFeed(url: string): Promise<RssItem[]> {
  const feed = await parser.parseURL(url);
  return feed.items as RssItem[];
}
