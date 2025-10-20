import type { Token, Tokens } from 'marked';
import { type BundledTheme, codeToHtml } from 'shiki';
import { Processor } from './processor.js';

/**
 * Default syntax highlighting theme
 */
const DEFAULT_THEME: BundledTheme = 'material-theme-palenight';

/**
 * Processor that adds syntax highlighting to code blocks using Shiki
 */
export class CodeProcessor extends Processor {
	private readonly theme: BundledTheme;

	/**
	 * Creates a new code processor
	 * @param theme - Shiki theme to use for syntax highlighting (default: material-theme-palenight)
	 */
	constructor(theme: BundledTheme = DEFAULT_THEME) {
		super();
		this.theme = theme;
	}

	/**
	 * Processes code blocks and applies syntax highlighting
	 * @param token - Code token to process
	 * @returns HTML token with syntax-highlighted code
	 */
	protected async code(token: Tokens.Code): Promise<boolean | Token> {
		const language = token.lang || 'text';
		const html = await codeToHtml(token.text, {
			lang: language,
			theme: this.theme
		});

		return {
			type: 'html',
			raw: html,
			pre: false,
			text: html,
			block: true
		};
	}
}
