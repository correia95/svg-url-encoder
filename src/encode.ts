// Turn an SVG string into data: URIs for CSS. The URL-encoded form (with a
// single-quote external delimiter) is smaller than base64 for most SVGs.

export interface Tidy {
  svg: string;
  changed: string[];
}

// Light clean-up that is safe for a data URI: drop XML prolog / doctype /
// comments, collapse whitespace, ensure the xmlns is present.
export function tidy(input: string): Tidy {
  let s = input.trim();
  const changed: string[] = [];

  if (/<\?xml[\s\S]*?\?>/i.test(s)) {
    s = s.replace(/<\?xml[\s\S]*?\?>/i, '');
    changed.push('removed the XML prolog');
  }
  if (/<!DOCTYPE[\s\S]*?>/i.test(s)) {
    s = s.replace(/<!DOCTYPE[\s\S]*?>/i, '');
    changed.push('removed the DOCTYPE');
  }
  if (/<!--[\s\S]*?-->/.test(s)) {
    s = s.replace(/<!--[\s\S]*?-->/g, '');
    changed.push('removed comments');
  }
  const before = s;
  s = s.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  if (s !== before) changed.push('collapsed whitespace');

  if (/<svg\b/i.test(s) && !/xmlns=/i.test(s)) {
    s = s.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    changed.push('added the xmlns attribute');
  }

  return { svg: s, changed };
}

// The compact encoding used by tools like "URL-encoder for SVG". Encode the
// characters a data URI can't contain, keep the rest readable, and use ' as the
// CSS string delimiter so " inside the SVG stays literal.
export function encodeUrl(svg: string): string {
  return svg
    .replace(/"/g, "'")
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]/g, '')
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\{/g, '%7B')
    .replace(/\}/g, '%7D')
    .replace(/\|/g, '%7C')
    .replace(/\^/g, '%5E')
    .replace(/`/g, '%60')
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D')
    .replace(/&/g, '%26')
    .trim();
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export interface Output {
  urlDataUri: string; // data:image/svg+xml,....
  base64DataUri: string; // data:image/svg+xml;base64,....
  urlCss: string; // background-image: url("data:...");
  base64Css: string;
  urlBytes: number;
  base64Bytes: number;
  rawBytes: number;
}

export function build(svg: string): Output | null {
  if (!/<svg[\s\S]*<\/svg>/i.test(svg)) return null;
  const enc = encodeUrl(svg);
  const b64 = utf8ToBase64(svg);
  const urlDataUri = `data:image/svg+xml,${enc}`;
  const base64DataUri = `data:image/svg+xml;base64,${b64}`;
  return {
    urlDataUri,
    base64DataUri,
    urlCss: `background-image: url("${urlDataUri}");`,
    base64Css: `background-image: url("${base64DataUri}");`,
    urlBytes: urlDataUri.length,
    base64Bytes: base64DataUri.length,
    rawBytes: new TextEncoder().encode(svg).length,
  };
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB`;
}
