export function formatAsciiTable(headers: string[], rows: Array<Record<string, string>>) {
  const widths = headers.map((h) => Math.max(h.length, ...rows.map((r) => (r[h] ?? '').length)));
  const sep =
    '+' +
    widths
      .map((w) => '-'.repeat(w + 2))
      .join('+') +
    '+';
  const head =
    '| ' +
    headers
      .map((h, i) => (h + ' '.repeat(widths[i] - h.length)))
      .join(' | ') +
    ' |';
  const body = rows
    .map(
      (r) =>
        '| ' +
        headers
          .map((h, i) => {
            const v = r[h] ?? '';
            return v + ' '.repeat(widths[i] - v.length);
          })
          .join(' | ') +
        ' |'
    )
    .join('\n');
  return [sep, head, sep, body || '', sep].filter(Boolean).join('\n');
}


