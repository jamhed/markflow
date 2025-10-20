import { DEFAULT_CACHE_TTL } from './constants.js';

/**
 * Generic cache entry with timestamp
 */
interface CacheEntry<T> {
	readonly value: T;
	readonly timestamp: number;
}

/**
 * Simple in-memory cache with TTL support
 */
export class ContentCache<T> {
	private readonly store = new Map<string, CacheEntry<T>>();
	private readonly maxAge: number;

	/**
	 * Creates a new content cache
	 * @param maxAge - Maximum age of cached entries in milliseconds
	 */
	constructor(maxAge: number = DEFAULT_CACHE_TTL) {
		this.maxAge = maxAge;
	}

	/**
	 * Retrieves a value from the cache
	 * @param key - Cache key
	 * @returns Cached value or undefined if not found or expired
	 */
	get(key: string): T | undefined {
		const entry = this.store.get(key);
		if (!entry) return undefined;

		if (Date.now() - entry.timestamp > this.maxAge) {
			this.store.delete(key);
			return undefined;
		}
		return entry.value;
	}

	/**
	 * Stores a value in the cache
	 * @param key - Cache key
	 * @param value - Value to cache
	 */
	set(key: string, value: T): void {
		this.store.set(key, { value, timestamp: Date.now() });
	}

	/**
	 * Checks if a key exists in the cache and is not expired
	 * @param key - Cache key
	 * @returns true if the key exists and is valid
	 */
	has(key: string): boolean {
		return this.get(key) !== undefined;
	}

	/**
	 * Removes a specific entry from the cache
	 * @param key - Cache key
	 */
	delete(key: string): void {
		this.store.delete(key);
	}

	/**
	 * Clears all entries from the cache
	 */
	clear(): void {
		this.store.clear();
	}

	/**
	 * Returns the number of entries in the cache
	 */
	get size(): number {
		return this.store.size;
	}
}
