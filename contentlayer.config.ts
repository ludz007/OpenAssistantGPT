// File: /contentlayer.config.ts

import { defineDocumentType, makeSource } from "contentlayer/source-files";

//
// 1) Define an Author type (e.g. authors/*.mdx).
//    We require `title` and `date`. No description on authors.
//
export const Author = defineDocumentType(() => ({
  name: "Author",
  filePathPattern: "authors/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    description: { type: "string", required: false }, // optional
  },
  // Optionally, you could reference other frontmatter/data here
}));

//
// 2) Define a Doc type (e.g. docs/**/*.mdx).
//    We require `title`, `date`; allow optional `description`.
//
export const Doc = defineDocumentType(() => ({
  name: "Doc",
  filePathPattern: "docs/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    description: { type: "string", required: false }, // allow if some docs define it
  },
}));

//
// 3) Define a Guide type (e.g. guides/**/*.mdx).
//    We require `title`, `date`; allow optional `description`.
//
export const Guide = defineDocumentType(() => ({
  name: "Guide",
  filePathPattern: "guides/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    description: { type: "string", required: false },
  },
}));

//
// 4) Export a single Contentlayer source. If your MDX files are in
//    the project root (e.g. authors/, docs/, guides/ at the root),
//    use contentDirPath: ".". Otherwise adjust if you keep them in "content/".
//
export default makeSource({
  contentDirPath: ".", // or "content" if your folder structure puts everything under /content
  documentTypes: [Author, Doc, Guide],
  disableImportAliasWarning: true, // suppress the import alias warning
});
