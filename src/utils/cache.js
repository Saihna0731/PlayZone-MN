// Simple cache utility with localStorage fallback
// API:
// cacheUtils.get(key)
// cacheUtils.set(key, value, ttlSeconds?)
// cacheUtils.remove(key)
// cacheUtils.clear(keyPrefix?)

const PREFIX = 'pcmap:';

const now = () => Math.floor(Date.now() / 1000);

// Memory cache for ultra-fast access
const memCache = new Map();

function readRaw(key) {
	// Check memory cache first
	const memKey = PREFIX + key;
	if (memCache.has(memKey)) {
		return memCache.get(memKey);
	}
	
	try {
		const k = PREFIX + key;
		const raw = localStorage.getItem(k);
		const data = raw ? JSON.parse(raw) : null;
		if (data) memCache.set(memKey, data);
		return data;
	} catch (e) {
		return null;
	}
}

function writeRaw(key, obj) {
	try {
		const k = PREFIX + key;
		memCache.set(k, obj); // Update memory cache
		localStorage.setItem(k, JSON.stringify(obj));
	} catch (e) {
		// ignore quota errors
	}
}

export const cacheUtils = {
	get(key) {
		const record = readRaw(key);
		if (!record) return null;
		const { value, exp } = record;
		if (exp && now() > exp) {
			this.remove(key);
			return null;
		}
		return value;
	},

	set(key, value, ttlSeconds) {
		const record = {
			value,
			exp: ttlSeconds ? now() + Number(ttlSeconds) : null,
		};
		writeRaw(key, record);
	},

	remove(key) {
		try {
			const k = PREFIX + key;
			memCache.delete(k); // Remove from memory cache
			localStorage.removeItem(k);
		} catch (_) {}
	},

	clear(prefix = '') {
		try {
			if (!prefix) {
				memCache.clear(); // Clear all memory cache
			}
			const p = PREFIX + prefix;
			const keys = [];
			for (let i = 0; i < localStorage.length; i++) {
				const k = localStorage.key(i);
				if (k && k.startsWith(p)) keys.push(k);
			}
			keys.forEach((k) => localStorage.removeItem(k));
		} catch (_) {}
	},
};

export default cacheUtils;
