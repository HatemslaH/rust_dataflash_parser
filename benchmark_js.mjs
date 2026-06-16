/**
 * Node harness for benchmarking JsDataflashParser (ES module).
 * Usage: node benchmark_js.mjs <file.bin>
 */
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const parserPath = new URL('./JsDataflashParser/parser.js', import.meta.url).pathname;

// parser.js uses `export default` but also references `self` for workers.
globalThis.self = globalThis;
globalThis.self.addEventListener = () => {};
globalThis.self.postMessage = () => {};
console.log = () => {};

const { default: DataflashParser } = await import(parserPath);

function estimateBytes(messages) {
  let bytes = 0;
  for (const fields of Object.values(messages)) {
    for (const arr of Object.values(fields)) {
      if (ArrayBuffer.isView(arr)) {
        bytes += arr.byteLength;
      } else if (Array.isArray(arr)) {
        if (arr.length > 0 && typeof arr[0] === 'string') {
          for (const s of arr) bytes += (s?.length ?? 0) * 2;
        } else if (arr.length > 0 && Array.isArray(arr[0])) {
          bytes += arr.length * arr[0].length * 2;
        } else {
          bytes += arr.length * 8;
        }
      }
    }
  }
  return bytes;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: node benchmark_js.mjs <file.bin>');
    process.exit(1);
  }

  const buf = fs.readFileSync(file);
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  const start = performance.now();
  const parser = new DataflashParser(false);
  const result = parser.processData(arrayBuffer);
  const elapsedMs = performance.now() - start;

  let messageCount = 0;
  let fieldCount = 0;
  let valueCount = 0;
  for (const fields of Object.values(result.messages)) {
    messageCount += 1;
    for (const arr of Object.values(fields)) {
      fieldCount += 1;
      if (ArrayBuffer.isView(arr)) valueCount += arr.length;
      else if (Array.isArray(arr)) valueCount += arr.length;
    }
  }

  const mem = process.memoryUsage();
  const estimatedBytes = estimateBytes(result.messages);

  process.stdout.write(
    `${JSON.stringify({
      file: file.replace(/\\/g, '/'),
      file_size: buf.length,
      parse_ms: Number(elapsedMs.toFixed(3)),
      messages: messageCount,
      fields: fieldCount,
      values: valueCount,
      estimated_bytes: estimatedBytes,
      rss_bytes: mem.rss,
      heap_used_bytes: mem.heapUsed,
    })}\n`,
  );
}

main();
