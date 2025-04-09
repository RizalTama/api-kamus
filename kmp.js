function computeLPSArray(p) {
  const lps = new Uint16Array(p.length); // Lebih ringan dari Array biasa
  let len = 0, i = 1;
  while (i < p.length) {
    if (p[i] === p[len]) {
      lps[i++] = ++len;
    } else {
      len ? len = lps[len - 1] : i++;
    }
  }
  return lps;
}

function KMPSearch(pattern, text, options = { caseSensitive: true }) {
  if (!pattern || !text || pattern.length > text.length) return [];

  if (!options.caseSensitive) {
    pattern = pattern.toLowerCase();
    text = text.toLowerCase();
  }

  const lps = computeLPSArray(pattern);
  const res = [];
  let i = 0, j = 0;

  while (i < text.length) {
    if (pattern[j] === text[i]) {
      i++; j++;
    }
    if (j === pattern.length) {
      res.push(i - j);
      j = lps[j - 1];
    } else if (i < text.length && pattern[j] !== text[i]) {
      j ? j = lps[j - 1] : i++;
    }
  }

  return res;
}

module.exports = { KMPSearch };
