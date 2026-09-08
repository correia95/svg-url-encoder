import { useMemo, useState } from 'react';
import { build, fmtBytes, tidy } from './encode.ts';

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round">
  <path d="M5 8l5 5 5-5" />
</svg>`;

const KEY = 'svg-url-encoder-input';

type Which = 'urlCss' | 'urlDataUri' | 'base64Css' | 'base64DataUri';

export default function App() {
  const [raw, setRaw] = useState(() => {
    try {
      return localStorage.getItem(KEY) ?? SAMPLE;
    } catch {
      return SAMPLE;
    }
  });
  const [doTidy, setDoTidy] = useState(true);
  const [copied, setCopied] = useState<Which | null>(null);

  const setInput = (v: string) => {
    setRaw(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
  };

  const t = useMemo(() => (doTidy ? tidy(raw) : { svg: raw.trim(), changed: [] }), [raw, doTidy]);
  const out = useMemo(() => build(t.svg), [t.svg]);

  const preview = useMemo(() => {
    if (!out) return '';
    try {
      return `url("${out.urlDataUri}")`;
    } catch {
      return '';
    }
  }, [out]);

  const copy = async (which: Which) => {
    if (!out) return;
    try {
      await navigator.clipboard.writeText(out[which]);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1400);
    } catch {
      /* ignore */
    }
  };

  const saving =
    out && out.base64Bytes > 0 ? Math.round((1 - out.urlBytes / out.base64Bytes) * 100) : 0;

  const block = (label: string, which: Which, value: string) => (
    <div className="ob">
      <div className="obhead">
        <span>{label}</span>
        <button onClick={() => copy(which)}>{copied === which ? 'Copied' : 'Copy'}</button>
      </div>
      <textarea readOnly value={value} rows={3} spellCheck={false} onFocus={(e) => e.currentTarget.select()} />
    </div>
  );

  return (
    <div className="app">
      <header>
        <h1>SVG URL Encoder</h1>
        <p className="tag">
          Turn an SVG into a <code>data:</code> URI you can drop straight into CSS{' '}
          <code>background-image</code> — no extra HTTP request. The URL-encoded form is smaller than
          base64 for most icons.
        </p>
      </header>

      <label className="ilabel">SVG source</label>
      <textarea
        className="in"
        value={raw}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        placeholder="Paste your <svg>…</svg> here"
        rows={7}
      />
      <label className="chk">
        <input type="checkbox" checked={doTidy} onChange={(e) => setDoTidy(e.target.checked)} />
        tidy first — drop the XML prolog, DOCTYPE and comments, collapse whitespace, add{' '}
        <code>xmlns</code>
      </label>
      {doTidy && t.changed.length > 0 && (
        <p className="changed">Tidied: {t.changed.join(', ')}.</p>
      )}

      {out ? (
        <>
          <div className="preview">
            <span className="pvl">Preview</span>
            <div className="pvbox" style={{ backgroundImage: preview }} role="img" aria-label="SVG preview" />
          </div>

          <div className="sizes">
            <span>
              raw <b>{fmtBytes(out.rawBytes)}</b>
            </span>
            <span>
              URL data URI <b>{fmtBytes(out.urlBytes)}</b>
            </span>
            <span>
              base64 <b>{fmtBytes(out.base64Bytes)}</b>
            </span>
            {saving > 0 && <span className="save">URL form is {saving}% smaller</span>}
          </div>

          {block('CSS — URL-encoded (recommended)', 'urlCss', out.urlCss)}
          {block('Data URI — URL-encoded', 'urlDataUri', out.urlDataUri)}
          {block('CSS — base64', 'base64Css', out.base64Css)}
          {block('Data URI — base64', 'base64DataUri', out.base64DataUri)}
        </>
      ) : (
        <p className="hint">Paste a complete <code>&lt;svg&gt;…&lt;/svg&gt;</code> to encode it.</p>
      )}

      <section className="explainer">
        <h2>Why inline an SVG as a data URI?</h2>
        <p>
          A background image that lives in your CSS loads with the stylesheet — no separate request,
          no flash of missing icon, and it works from a <code>::before</code> or a border-image where
          you can't put an <code>&lt;img&gt;</code>. The trade-off is that the bytes can't be cached
          separately and they bloat your CSS, so it's best for small, rarely-changing icons.
        </p>
        <h3>URL-encoded vs base64</h3>
        <p>
          Base64 always adds about 33% overhead. URL-encoding an SVG only escapes the handful of
          characters a data URI disallows (<code>&lt; &gt; # %</code> and a few more) and leaves the
          rest readable, so it's usually 20–40% smaller and you can still see the markup. Use{' '}
          <code>'</code> as the CSS string quote so the SVG's own <code>"</code> attributes don't
          need escaping.
        </p>
        <h3>Tips for smaller output</h3>
        <p>
          Run the SVG through an optimiser (like SVGO) first, remove <code>width</code>/
          <code>height</code> if you'll size it in CSS, drop editor metadata, and round path
          coordinates. Every byte here is repeated in your stylesheet.
        </p>
        <h3>Is my SVG sent anywhere?</h3>
        <p>No. Encoding happens in your browser and the source is saved only in local storage.</p>
        <footer>SVG URL Encoder · no sign-up · works offline once loaded</footer>
      </section>
    </div>
  );
}
