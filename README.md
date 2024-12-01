# Markflow

Markdown content processing toolkit, extendable with custom processors and directives.
Content is supposed to be a folder with markdown files under git control.
Markdown files are parsed into AST with `marked` library and then transformed and rendered.

## Metadata

Each file has metadata associated:

```ts
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
```

Fields like `created`, `modified` and `author` are populated from git.

## Code

Code blocks are rendered with `shiki`.

## Front matter

Markdown file header allows overriding metadata:

```md
# Title
field: value

Description
```

The first header goes into `title`, and the first paragraph into `description` fields.