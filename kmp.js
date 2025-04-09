// Hitung array LPS (Longest Prefix Suffix)
function computeLPSArray(pattern) {
    const lps = Array(pattern.length).fill(0);
    let len = 0;
    let i = 1;
  
    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i++] = len;
      } else {
        if (len !== 0) {
          len = lps[len - 1];
        } else {
          lps[i++] = 0;
        }
      }
    }
    return lps;
  }
  
  // Fungsi utama KMP
  function KMPSearch(pattern, text, options = { caseSensitive: true }) {
    if (!pattern || !text) return [];
  
    // Early return jika pattern lebih panjang dari teks
    if (pattern.length > text.length) return [];
  
    // Case insensitive opsional
    if (!options.caseSensitive) {
      pattern = pattern.toLowerCase();
      text = text.toLowerCase();
    }
  
    const lps = computeLPSArray(pattern);
    const result = [];
    const m = pattern.length;
    const n = text.length;
    let i = 0, j = 0;
  
    while (i < n) {
      if (pattern[j] === text[i]) {
        i++;
        j++;
      }
  
      if (j === m) {
        result.push(i - j); // Pattern ditemukan
        j = lps[j - 1];
      } else if (i < n && pattern[j] !== text[i]) {
        if (j !== 0) {
          j = lps[j - 1];
        } else {
          i++;
        }
      }
    }
  
    return result;
  }
  
  module.exports = { KMPSearch };
  