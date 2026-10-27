export function extractTidFromText(text: string): string | null {
  if (!text || typeof text !== 'string') return null;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const cleanVal = (val: string) => {
    if (!val) return '';
    return val
      .replace(/^[\s:#\.\-\|\>]+/, '')
      .replace(/[\s\.\,\|\<]+$/, '')
      .replace(/\s+/g, '')
      .trim();
  };

  const isInvalidTid = (val: string) => {
    if (!val || val.length < 5 || val.length > 40) return true;
    // Don't match dates e.g. 24/10/2026, 24-10-2026, 24.10.2026
    if (/^\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(val)) return true;
    // Don't match times e.g. 14:32:00 or 02:40 PM
    if (/^\d{1,2}:\d{2}(:\d{2})?(\s*(am|pm))?$/i.test(val)) return true;
    // Don't match Pakistani mobile phone numbers starting with 03xx or 923xx or +92
    if (/^(03\d{9}|923\d{9}|\+923\d{9})$/.test(val)) return true;
    // Don't match amounts or currency words like "PKR 500" or "Rs. 1000"
    if (/^(rs|pkr|usd|pkr\.|rs\.)?\s*\d+(\.\d{2})?$/i.test(val) && val.length < 8) return true;
    return false;
  };

  const labelRegex =
    /(?:trx\s*id|transaction\s*id|trans\s*id|trans\s*no|tx\s*id|txn\s*id|tid|raast\s*id|raast\s*ref|rrn|reference\s*(?:no|num|number|id)?|ref\s*(?:no|num|number|id)?|order\s*id|journal\s*no|utr|stan|receipt\s*no)[\s:#\.\-\|\>]*/i;

  // 1. Inline match: "TRX ID: 34829105821" or "TID: 0294817592"
  for (const line of lines) {
    const match = line.match(
      new RegExp(
        `(?:trx\\s*id|transaction\\s*id|trans\\s*id|trans\\s*no|tx\\s*id|txn\\s*id|tid|raast\\s*id|raast\\s*ref|rrn|reference\\s*(?:no|num|number|id)?|ref\\s*(?:no|num|number|id)?|order\\s*id|journal\\s*no|utr|stan|receipt\\s*no)[\\s:#\\.\\-\\|\\>]+([A-Za-z0-9_\\-]{6,36})`,
        'i'
      )
    );
    if (match && match[1]) {
      const candidate = cleanVal(match[1]);
      if (!isInvalidTid(candidate)) {
        return candidate;
      }
    }
  }

  // 2. Next-Line match:
  // Line i: "Transaction ID"
  // Line i+1: "34829105821"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (labelRegex.test(line)) {
      for (let j = 1; j <= 2; j++) {
        if (i + j < lines.length) {
          const nextLine = lines[i + j];
          const candidateMatch = nextLine.match(/([A-Za-z0-9_\\-]{6,36})/);
          if (candidateMatch) {
            const candidate = cleanVal(candidateMatch[1]);
            if (!isInvalidTid(candidate)) {
              return candidate;
            }
          }
        }
      }
    }
  }

  // 3. Bank FT numbers: "FT240981029481"
  const ftMatch = text.match(/\b(FT\d{8,16})\b/i);
  if (ftMatch && !isInvalidTid(ftMatch[1])) {
    return ftMatch[1].toUpperCase();
  }

  // 4. Standalone 10-12 digit continuous number (EasyPaisa / JazzCash) that is NOT a phone number
  const epMatches = text.match(/\b([1-9]\d{9,11})\b/g);
  if (epMatches) {
    for (const m of epMatches) {
      if (!m.startsWith('03') && !m.startsWith('92') && !isInvalidTid(m)) {
        return m;
      }
    }
  }

  return null;
}
