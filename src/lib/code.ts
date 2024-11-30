import type { Token, Tokens } from 'marked';
import { type BundledTheme, codeToHtml } from 'shiki';
import { Processor } from './processor.js';

export class CodeProcessor extends Processor {
  constructor(private theme: BundledTheme = 'material-theme-palenight') {
    super();
  }
  async code(token: Tokens.Code): Promise<boolean | Token> {
    const html = await codeToHtml(token.text, { lang: token.lang || 'text', theme: this.theme });
    return { type: 'html', raw: html, pre: false, text: html, block: true };
  }
}
