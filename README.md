# SVG URL Encoder

Paste an SVG, get a `data:` URI for CSS `background-image` — no extra HTTP request.

- **Tidy** (optional): drop the XML prolog / DOCTYPE / comments, collapse whitespace,
  add `xmlns`; lists what it changed.
- Four outputs, each copy-ready: **CSS URL-encoded** (recommended), the raw URL data URI,
  **CSS base64**, the raw base64 data URI.
- URL-encoding escapes only the characters a data URI disallows and switches the SVG's
  `"` to `'` so nothing needs backslash-escaping — usually 20–40% smaller than base64.
- Live preview (the encoded URI rendered as a background) and a raw / URL / base64 byte
  comparison. Source saved to `localStorage`. No upload, works offline.

## Develop

```
npm install
npm run dev
npm run build
```

Encoder: [`src/encode.ts`](src/encode.ts). Static site on Cloudflare Workers.

Part of [Tiny Tools](https://tinytools.correia95.workers.dev).
