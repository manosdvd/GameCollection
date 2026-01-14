import { generateCipher } from './cipher';
import { CUSTOM_QUOTES } from '../data/customQuotes';

const SEEN_STORAGE_KEY = 'crypto_puzzle_seen_hashes';
const MAX_HISTORY = 50;

// --- History / Deduping Logic ---

const getSeenHashes = () => {
    try {
        const stored = localStorage.getItem(SEEN_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.warn("Failed to read seen hashes", e);
        return [];
    }
};

const saveSeenHash = (hash) => {
    try {
        const seen = getSeenHashes();
        // Add new hash to the front
        const newSeen = [hash, ...seen].slice(0, MAX_HISTORY);
        localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(newSeen));
    } catch (e) {
        console.warn("Failed to save seen hash", e);
    }
};

// Simple string hash for deduping
const hashString = (str) => {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
};


// --- Fetchers ---

const fetchFromDummyJSON = async () => {
    const response = await fetch('https://dummyjson.com/quotes/random');
    if (!response.ok) throw new Error('DummyJSON API failed');
    const data = await response.json();
    return { quote: data.quote, author: data.author, source: 'dummyjson.com' };
};


// --- Main Logic ---

export const fetchNewGameData = async () => {
    const seenHashes = new Set(getSeenHashes());
    let rawQuoteData = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    // Helper to get formatted data
    const prepareData = (q, a, s) => {
        const cleanQuote = q.trim().toUpperCase();
        const cleanAuthor = a.trim();
        const { newCipher, newReverseCipher } = generateCipher();

        // Save to history
        saveSeenHash(hashString(cleanQuote));

        return {
            quote: cleanQuote,
            author: cleanAuthor,
            source: s,
            cipher: newCipher,
            reverseCipher: newReverseCipher
        };
    };

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
            // Weighted Selection:
            // 70% Bulk Database
            // 20% Curated Collection (Pop Culture)
            // 10% DummyJSON (Live API)
            const rand = Math.random();

            if (rand < 0.7) {
                // Bulk Database
                // Dynamic Import
                const module = await import('../data/bulkQuotes.json');
                const BULK_QUOTES = module.default || module;

                const item = BULK_QUOTES[Math.floor(Math.random() * BULK_QUOTES.length)];
                rawQuoteData = {
                    quote: item.quoteText,
                    author: item.quoteAuthor,
                    source: 'Quote Database'
                };
            } else if (rand < 0.9) {
                // Curated Collection
                const item = CUSTOM_QUOTES[Math.floor(Math.random() * CUSTOM_QUOTES.length)];
                rawQuoteData = { ...item, source: 'Curated Collection' };
            } else {
                // Live API
                try {
                    rawQuoteData = await fetchFromDummyJSON();
                } catch (e) {
                    console.warn("DummyJSON failed, using Bulk fallback");
                    const module = await import('../data/bulkQuotes.json');
                    const BULK_QUOTES = module.default || module;

                    const item = BULK_QUOTES[Math.floor(Math.random() * BULK_QUOTES.length)];
                    rawQuoteData = {
                        quote: item.quoteText,
                        author: item.quoteAuthor,
                        source: 'Quote Database (Fallback)'
                    };
                }
            }

            // Check if seen
            const quoteHash = hashString(rawQuoteData.quote.trim().toUpperCase());
            if (seenHashes.has(quoteHash)) {
                console.log("Duplicate quote found, retrying...", rawQuoteData.quote);
                rawQuoteData = null; // Retry
                continue;
            }

            // Ensure valid data (some bulk quotes might be empty or too short)
            if (!rawQuoteData.quote || rawQuoteData.quote.length < 10) {
                rawQuoteData = null;
                continue;
            }

            // If we got here, we have a valid unique quote
            break;

        } catch (error) {
            console.warn(`Attempt ${attempts} failed:`, error);
        }
    }

    // Safety fallback if all attempts fail
    if (!rawQuoteData) {
        console.warn("All fetch attempts failed, using safety fallback.");
        const module = await import('../data/bulkQuotes.json');
        const BULK_QUOTES = module.default || module;

        const fallback = BULK_QUOTES[Math.floor(Math.random() * BULK_QUOTES.length)];
        rawQuoteData = {
            quote: fallback.quoteText,
            author: fallback.quoteAuthor,
            source: 'Quote Database (Emergency)'
        };
    }

    return prepareData(rawQuoteData.quote, rawQuoteData.author, rawQuoteData.source);
};
