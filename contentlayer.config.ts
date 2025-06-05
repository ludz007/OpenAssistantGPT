// File: /contentlayer.config.ts

import { defineDocumentType, makeSource } from "contentlayer/source-files";

// Example document type; adapt to your own contentfolder and schema
export const SomeDoc = defineDocumentType(() => ({
  name: "SomeDoc",
  filePathPattern: "**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
  },
}));

export default makeSource({
  contentDirPath: "content",
  documentTypes: [SomeDoc],
  disableImportAliasWarning: true,
});
