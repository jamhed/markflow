import { load } from 'js-yaml';
import { type Token, type Tokens } from 'marked';
import { Processor, type Dispatch } from './processor.js';

export interface FileMeta {
  file: string;
  path: string;
  slug?: string;
  created?: string | Date;
  created_ts?: number;
  author?: string;
  modified?: string | Date;
  modified_ts?: number;
}

export interface FolderPart {
  part: string;
  folder: string;
}

export interface DocumentMeta extends FileMeta {
  title?: string;
  skip?: boolean;
  hero?: boolean;
  parts?: FolderPart[];
  description?: string;
}

export interface Options {
  keepHeader?: boolean;
}

function textify(token: Tokens.Generic) {
  let result = '';
  if (token.tokens) {
    token.tokens.forEach((token) => (result += textify(token)));
  } else {
    result = token.text;
  }
  return result;
}

export class MetaProcessor extends Processor {
  headings: number;
  paragraphs: number;
  meta: Partial<DocumentMeta>;
  constructor(private options: Options = {}) {
    super();
    this.headings = 0;
    this.paragraphs = 0;
    this.meta = {};
  }
  async toString(token: Token): Promise<string> {
    return textify(token);
  }
  async heading(token: Tokens.Heading): Dispatch {
    this.headings++;
    if (this.tokenNumber == 1 && this.headings == 1 && token.depth == 1) {
      this.meta.title = await this.toString(token);
      if (this.options.keepHeader) return true;
      return false;
    }
  }
  async paragraph(token: Tokens.Paragraph): Dispatch {
    this.paragraphs++;
    if (this.paragraphs == 1) {
      try {
        const meta = load(token.raw) as Partial<DocumentMeta>;
        if (typeof meta === 'string') {
          this.meta.description = await this.toString(token);
        }
        if (typeof meta === 'object') {
          this.meta = { ...this.meta, ...meta };
          return false;
        }
      } catch {
        this.meta.description = await this.toString(token);
      }
    }
    if (this.paragraphs == 2 && !this.meta.description) {
      this.meta.description = await this.toString(token);
    }
  }
}
