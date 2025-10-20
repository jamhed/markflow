import { load } from 'js-yaml';
import { type Token, type Tokens } from 'marked';
import { Processor, type Dispatch } from './processor.js';

/**
 * Basic metadata for file system entries
 */
export interface FolderEntryMeta {
	name: string;
	path: string;
	isFolder: boolean;
	slug?: string;
	created?: string | Date;
	createdTs?: number;
	author?: string;
	modified?: string | Date;
	modifiedTs?: number;
}

/**
 * Represents a part of a breadcrumb path
 */
export interface PathPart {
	name: string;
	path: string;
}

/**
 * Extended metadata for markdown documents
 */
export interface DocumentMeta extends FolderEntryMeta {
	title?: string;
	skip?: boolean;
	hero?: boolean;
	parts?: PathPart[];
	description?: string;
}

/**
 * Configuration options for the metadata processor
 */
export interface MetaProcessorOptions {
	keepHeader?: boolean;
}

/**
 * Type guard to check if a token has nested tokens
 */
function isGenericToken(token: Token): token is Tokens.Generic {
	return 'tokens' in token && Array.isArray((token as Tokens.Generic).tokens);
}

/**
 * Extracts plain text from a token tree
 * @param token - Token to extract text from
 * @returns Plain text content
 */
function tokenToText(token: Token): string {
	if (isGenericToken(token) && token.tokens) {
		return token.tokens.map(tokenToText).join('');
	}
	return 'text' in token ? (token as { text: string }).text : '';
}

/**
 * Processor that extracts metadata from markdown documents
 * - Extracts title from first H1 heading
 * - Parses YAML frontmatter from first paragraph
 * - Extracts description from first text paragraph
 */
export class MetaProcessor extends Processor {
	private headingCount: number;
	private paragraphCount: number;
	public meta: Partial<DocumentMeta>;

	constructor(private readonly options: MetaProcessorOptions = {}) {
		super();
		this.headingCount = 0;
		this.paragraphCount = 0;
		this.meta = {};
	}

	/**
	 * Converts a token to its string representation
	 * @param token - Token to convert
	 * @returns Plain text content
	 */
	private async tokenToString(token: Token): Promise<string> {
		return tokenToText(token);
	}

	/**
	 * Processes heading tokens, extracting the title from the first H1
	 */
	protected async heading(token: Tokens.Heading): Dispatch {
		this.headingCount++;

		// First H1 heading becomes the title
		if (this.tokenNumber === 1 && this.headingCount === 1 && token.depth === 1) {
			this.meta.title = await this.tokenToString(token);

			// Remove the heading from output unless keepHeader is true
			if (this.options.keepHeader) {
				return true;
			}
			return false;
		}

		return undefined;
	}

	/**
	 * Processes paragraph tokens, extracting YAML frontmatter and description
	 */
	protected async paragraph(token: Tokens.Paragraph): Dispatch {
		this.paragraphCount++;

		// Try to parse first paragraph as YAML frontmatter
		if (this.paragraphCount === 1) {
			try {
				const parsed = load(token.raw);

				if (typeof parsed === 'string') {
					// Not YAML, use as description
					this.meta.description = await this.tokenToString(token);
				} else if (parsed !== null && typeof parsed === 'object') {
					// Valid YAML frontmatter
					this.meta = { ...this.meta, ...(parsed as Partial<DocumentMeta>) };
					// Remove frontmatter from output
					return false;
				}
			} catch {
				// Failed to parse as YAML, use as description
				this.meta.description = await this.tokenToString(token);
			}
		}

		// Use second paragraph as description if we don't have one yet
		if (this.paragraphCount === 2 && !this.meta.description) {
			this.meta.description = await this.tokenToString(token);
		}

		return undefined;
	}
}
