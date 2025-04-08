// kmp.js

// Fungsi untuk menghitung array LPS (Longest Prefix Suffix)
function computeLPSArray(pattern) {
    const lps = new Array(pattern.length).fill(0);
    let length = 0;
    let i = 1;

    while (i < pattern.length) {
        if (pattern[i] === pattern[length]) {
            length++;
            lps[i] = length;
            i++;
        } else {
            if (length !== 0) {
                length = lps[length - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}

// Fungsi KMP untuk mencari pattern dalam teks
function KMPSearch(pattern, text) {
    const lps = computeLPSArray(pattern);
    const result = [];
    let i = 0; // Indeks untuk text
    let j = 0; // Indeks untuk pattern

    while (i < text.length) {
        if (pattern[j] === text[i]) {
            i++;
            j++;
        }
        if (j === pattern.length) {
            // Pattern ditemukan pada indeks (i - j)
            result.push(i - j);
            j = lps[j - 1];
        } else if (i < text.length && pattern[j] !== text[i]) {
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
