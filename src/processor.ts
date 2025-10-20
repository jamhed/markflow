import {
	Marked,
	type MarkedExtension,
	type Token,
	type TokenizerExtension,
	type Tokens
} from 'marked';

export { type TokenizerExtension, type Token } from 'marked';

/**
 * Return type for token dispatch handlers
 * - undefined: Continue processing with default behavior
 * - false: Skip this token (don't include in output)
 * - true: Keep token as-is
 * - Token: Replace with this token
 */
export type Dispatch = Promise<void | boolean | Token>;

/**
 * Handler function for processing a specific token type
 */
export type TokenHandler = (token: Token) => Dispatch;

/**
 * Marked directive for extending markdown processing
 */
export interface MarkedDirective {
	extensions: TokenizerExtension[];
	query(token: Token): Promise<void>;
	walkTokens(token: Token): Promise<void>;
}

/**
 * Registered marked directives
 */
const directives: MarkedDirective[] = [];

/**
 * Registers a new marked directive
 * @param directive - The directive to register
 */
export function addDirective(directive: MarkedDirective): void {
	directives.push(directive);
}

/**
 * Creates a Marked instance with all registered directives
 * @returns Configured Marked instance
 */
function markedInstance(): Marked {
	const marked = new Marked();
	for (const directive of directives) {
		marked.use(directive);
	}
	return marked;
}

/**
 * Base processor for handling markdown tokens
 * Subclasses can override token handler methods to customize processing
 */
export class Processor {
	protected tokenNumber: number;
	public meta: Record<string, unknown>;

	constructor() {
		this.tokenNumber = 0;
		this.meta = {};
	}

	/**
	 * Parses markdown text
	 * @param text - Markdown text to parse
	 * @param options - Optional Marked extension options
	 * @returns Parsed HTML string
	 */
	async parse(text: string, options: MarkedExtension = {}): Promise<string> {
		return this.marked().use(options).parse(text) as Promise<string>;
	}

	/**
	 * Creates a Marked instance configured for this processor
	 * @returns Configured Marked instance
	 */
	marked(): Marked {
		return new Marked().use({
			async: true,
			hooks: { processAllTokens: async (tokens: Token[]) => await this.processAllTokens(tokens) }
		});
	}

	/**
	 * Processes all tokens in the token tree
	 * @param tokens - Array of tokens to process
	 * @returns Processed token array
	 */
	async processAllTokens(tokens: Token[]): Promise<Token[]> {
		const result: Token[] = [];

		for (const token of tokens) {
			const dispatchResult = await this.dispatchToken(token);

			if (dispatchResult === undefined) {
				// Default behavior: recurse into nested tokens
				if (this.isGenericToken(token) && token.tokens) {
					token.tokens = await this.processAllTokens(token.tokens);
				}
				result.push(token);
				continue;
			}

			if (!dispatchResult) {
				// false: skip this token
				continue;
			}

			if (typeof dispatchResult === 'boolean') {
				// true: keep token, but still recurse into children
				if (this.isGenericToken(token) && token.tokens) {
					token.tokens = await this.processAllTokens(token.tokens);
				}
				result.push(token);
			} else {
				// Token: replace with returned token
				result.push(dispatchResult);
			}
		}

		return result;
	}

	/**
	 * Type guard for tokens with nested tokens
	 * @param token - Token to check
	 * @returns true if token has nested tokens
	 */
	protected isGenericToken(token: Token): token is Tokens.Generic {
		return 'tokens' in token && Array.isArray((token as Tokens.Generic).tokens);
	}

	/**
	 * Dispatches a token to its handler method
	 * Uses reflection to call the appropriate method based on token type
	 * @param token - Token to dispatch
	 * @returns Dispatch result
	 */
	protected async dispatchToken(token: Token): Dispatch {
		this.tokenNumber++;

		// Type-safe dynamic dispatch using index signature
		const handler = (this as Record<string, unknown>)[token.type];

		if (typeof handler === 'function') {
			return (handler as TokenHandler).call(this, token);
		}

		return this.generic(token);
	}

	// Token handler methods - subclasses can override these
	protected async space(_token: Tokens.Space): Dispatch {
		return undefined;
	}

	protected async code(_token: Tokens.Code): Dispatch {
		return undefined;
	}

	protected async heading(_token: Tokens.Heading): Dispatch {
		return undefined;
	}

	protected async table(_token: Tokens.Table): Dispatch {
		return undefined;
	}

	protected async tablerow(_token: Tokens.TableRow): Dispatch {
		return undefined;
	}

	protected async tablecell(_token: Tokens.TableCell): Dispatch {
		return undefined;
	}

	protected async hr(_token: Tokens.Hr): Dispatch {
		return undefined;
	}

	protected async blockquote(_token: Tokens.Blockquote): Dispatch {
		return undefined;
	}

	protected async list(_token: Tokens.List): Dispatch {
		return undefined;
	}

	protected async listitem(_token: Tokens.ListItem): Dispatch {
		return undefined;
	}

	protected async checkbox(_token: Tokens.Checkbox): Dispatch {
		return undefined;
	}

	protected async paragraph(_token: Tokens.Paragraph): Dispatch {
		return undefined;
	}

	protected async html(_token: Tokens.HTML): Dispatch {
		return undefined;
	}

	protected async text(_token: Tokens.Text): Dispatch {
		return undefined;
	}

	protected async def(_token: Tokens.Def): Dispatch {
		return undefined;
	}

	protected async escape(_token: Tokens.Escape): Dispatch {
		return undefined;
	}

	protected async tag(_token: Tokens.Tag): Dispatch {
		return undefined;
	}

	protected async link(_token: Tokens.Link): Dispatch {
		return undefined;
	}

	protected async image(_token: Tokens.Image): Dispatch {
		return undefined;
	}

	protected async strong(_token: Tokens.Strong): Dispatch {
		return undefined;
	}

	protected async em(_token: Tokens.Em): Dispatch {
		return undefined;
	}

	protected async codespan(_token: Tokens.Codespan): Dispatch {
		return undefined;
	}

	protected async br(_token: Tokens.Br): Dispatch {
		return undefined;
	}

	protected async del(_token: Tokens.Del): Dispatch {
		return undefined;
	}

	protected async generic(_token: Tokens.Generic): Dispatch {
		return undefined;
	}
}

/**
 * Chains multiple processors together
 * Processes tokens through each processor in sequence
 */
export class ProcessorChain {
	public meta: Record<string, unknown>;
	private readonly processors: Processor[];
	private readonly options: MarkedExtension[];

	constructor(...processors: Processor[]) {
		this.meta = {};
		this.processors = processors;
		this.options = [];
	}

	/**
	 * Adds marked extension options
	 * @param options - Marked extension to add
	 * @returns This chain for method chaining
	 */
	use(options: MarkedExtension): this {
		this.options.push(options);
		return this;
	}

	/**
	 * Parses markdown text through the processor chain
	 * @param text - Markdown text to parse
	 * @param options - Optional Marked extension options
	 * @returns Parsed HTML string
	 */
	async parse(text: string, options: MarkedExtension = {}): Promise<string> {
		return this.marked().use(options).parse(text) as Promise<string>;
	}

	/**
	 * Creates a Marked instance with all processors and options
	 * @returns Configured Marked instance
	 */
	marked(): Marked {
		const marked = markedInstance().use({
			async: true,
			hooks: { processAllTokens: async (tokens: Token[]) => await this.processAllTokens(tokens) }
		});

		for (const option of this.options) {
			marked.use(option);
		}

		return marked;
	}

	/**
	 * Processes tokens through all processors in the chain
	 * @param tokens - Tokens to process
	 * @returns Processed tokens
	 */
	async processAllTokens(tokens: Token[]): Promise<Token[]> {
		let currentTokens = tokens;

		for (const processor of this.processors) {
			currentTokens = await processor.processAllTokens(currentTokens);
			// Merge processor metadata into chain metadata
			this.meta = { ...this.meta, ...processor.meta };
		}

		return currentTokens;
	}
}
