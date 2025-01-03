# Markflow

Markflow is markdown content processing toolkit, extendable with custom processors and directives.
Content is supposed to be a folder with markdown files under git control. Markdown files are parsed
into AST with `marked` library and then transformed and rendered into HTML to be presented
by Svelte components.

## Metadata

Each file has metadata associated:

```ts
file: string; // file name
path: string; // file path
created?: string | Date;
created_ts?: number; // unix timestamp
modified?: string | Date;
modified_ts?: number;

author?: string; // git committer
slug?: string; // generated slug

title?: string; // see below
description?: string; // see below
skip?: boolean; // flag to ignore file (for drafts)
hero?: boolean; // flag to include file into top
folder?: boolean; // flag to indicate folder view
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