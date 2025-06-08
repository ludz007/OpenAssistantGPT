import { readDataStream } from '../lib/read-data-stream';
import { formatStreamPart } from '../lib/utils';
import type { StreamPartType } from '../lib/stream-parts';
import { describe, it, expect } from 'vitest';

function createStream(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    pull(controller) {
      if (chunks.length === 0) {
        controller.close();
      } else {
        controller.enqueue(chunks.shift()!);
      }
    },
  });
}

describe('readDataStream', () => {
  it('parses stream chunks into parts', async () => {
    const encoder = new TextEncoder();
    const streamString =
      formatStreamPart('text', 'hello') +
      formatStreamPart('text', 'world');
    const bytes = encoder.encode(streamString);
    const chunk1 = bytes.slice(0, 5);
    const chunk2 = bytes.slice(5, 15);
    const chunk3 = bytes.slice(15);
    const reader = createStream([chunk1, chunk2, chunk3]).getReader();

    const parts: StreamPartType[] = [];
    for await (const part of readDataStream(reader)) {
      parts.push(part);
    }

    expect(parts).toEqual([
      { type: 'text', value: 'hello' },
      { type: 'text', value: 'world' },
    ]);
  });
});
