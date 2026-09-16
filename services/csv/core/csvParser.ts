/**
 * Core CSV line parsing and character encoding detection utilities.
 */

/**
 * Parses a single CSV line respecting double quotes and escaped quotes.
 */
export const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += c;
        }
    }
    result.push(cur.trim());
    return result;
};

/**
 * Helper: Reads a File/Blob as text with automatic Thai encoding detection.
 * Supports UTF-8 (with or without BOM), Windows-874, and TIS-620.
 */
export const readFileAsTextWithAutoEncoding = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target?.result as ArrayBuffer;
            if (!buffer) {
                resolve('');
                return;
            }
            const bytes = new Uint8Array(buffer);

            // Check for UTF-8 BOM (EF BB BF)
            if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
                const decoder = new TextDecoder('utf-8');
                resolve(decoder.decode(bytes.slice(3)));
                return;
            }

            // Attempt strict UTF-8 decode
            try {
                const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
                const text = utf8Decoder.decode(bytes);
                resolve(text);
                return;
            } catch {
                // Not valid UTF-8, proceed to Thai fallback
            }

            // Fallback: Windows-874 / TIS-620 for Thai Excel CSVs
            try {
                const win874Decoder = new TextDecoder('windows-874');
                const text = win874Decoder.decode(bytes);
                resolve(text);
                return;
            } catch {
                // Final fallback standard UTF-8 (non-fatal)
                const fallbackDecoder = new TextDecoder('utf-8');
                resolve(fallbackDecoder.decode(bytes));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
};
