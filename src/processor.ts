import { Marked, type MarkedExtension, type Token, type Tokens } from 'marked';

export type Dispatch = Promise<void | boolean | Token>;

const extensions: MarkedExtension[] = [];

export function addDirective(e: MarkedExtension) {
  extensions.push(e);
}

function markedInstance() {
  const marked = new Marked();
  for (let d of extensions) {
    marked.use(d);
  }
  return marked;
}

export class Processor {
  tokenNumber: number;
  meta: Record<string, any>;
  constructor() {
    this.tokenNumber = 0;
    this.meta = {};
  }
  parse(text: string, options: MarkedExtension = {}) {
    return this.marked().use(options).parse(text);
  }
  marked() {
    return new Marked().use({
      async: true,
      hooks: { processAllTokens: async (tokens: Token[]) => await this.processAllTokens(tokens) }
    });
  }
  async processAllTokens(tokens: Token[]): Promise<Token[]> {
    const result: Token[] = [];
    for (const token of tokens) {
      const re = await this.dispatchToken(token);
      if (re === undefined) {
        if (this.isGenericToken(token) && token.tokens) {
          token.tokens = await this.processAllTokens(token.tokens);
        }
        result.push(token);
        continue;
      }
      if (!re) continue;
      if (typeof re === 'boolean') {
        if (this.isGenericToken(token) && token.tokens) {
          token.tokens = await this.processAllTokens(token.tokens);
        }
        result.push(token);
      } else {
        result.push(re);
      }
    }
    return result;
  }
  isGenericToken(token: Token): token is Tokens.Generic {
    return (token as Tokens.Generic).tokens !== undefined;
  }
  async dispatchToken(token: Token): Dispatch {
    this.tokenNumber++;
    if (typeof (this as any)[token.type] === 'function') {
      return (this as any)[token.type](token);
    } else {
      return this.generic(token);
    }
  }
  async space(_token: Tokens.Space): Dispatch {}
  async code(_token: Tokens.Code): Dispatch {}
  async heading(_token: Tokens.Heading): Dispatch {}
  async table(_token: Tokens.Table): Dispatch {}
  async tablerow(_token: Tokens.TableRow): Dispatch {}
  async tablecell(_token: Tokens.TableCell): Dispatch {}
  async hr(_token: Tokens.Hr): Dispatch {}
  async blockquote(_token: Tokens.Blockquote): Dispatch {}
  async list(_token: Tokens.List): Dispatch {}
  async listitem(_token: Tokens.ListItem): Dispatch {}
  async checkbox(_token: Tokens.Checkbox): Dispatch {}
  async paragraph(_token: Tokens.Paragraph): Dispatch {}
  async html(_token: Tokens.Paragraph): Dispatch {}
  async text(_token: Tokens.Text): Dispatch {}
  async def(_token: Tokens.Def): Dispatch {}
  async escape(_token: Tokens.Escape): Dispatch {}
  async tag(_token: Tokens.Tag): Dispatch {}
  async link(_token: Tokens.Link): Dispatch {}
  async image(_token: Tokens.Image): Dispatch {}
  async strong(_token: Tokens.Strong): Dispatch {}
  async em(_token: Tokens.Em): Dispatch {}
  async codespan(_token: Tokens.Codespan): Dispatch {}
  async br(_token: Tokens.Br): Dispatch {}
  async del(_token: Tokens.Del): Dispatch {}
  async generic(_token: Tokens.Generic): Dispatch {}
}

export class ProcessorChain {
  meta: Record<string, any>;
  processors: Processor[];
  options: MarkedExtension[];
  constructor(...processors: Processor[]) {
    this.meta = {};
    this.processors = processors;
    this.options = [];
  }
  use(options: MarkedExtension) {
    this.options.push(options);
    return this;
  }
  parse(text: string, options: MarkedExtension = {}) {
    return this.marked().use(options).parse(text);
  }
  marked() {
    const marked = markedInstance().use({
      async: true,
      hooks: { processAllTokens: async (tokens: Token[]) => await this.processAllTokens(tokens) }
    });
    for (const option of this.options) {
      marked.use(option);
    }
    return marked;
  }
  async processAllTokens(tokens: Token[]): Promise<Token[]> {
    for (const processor of this.processors) {
      tokens = await processor.processAllTokens(tokens);
      if (processor.meta) {
        this.meta = { ...this.meta, ...processor.meta };
      }
    }
    return tokens;
  }
}
