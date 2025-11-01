// Simple cache utility with localStorage fallback
// API:
// cacheUtils.get(key)
// cacheUtils.set(key, value, ttlSeconds?)
// cacheUtils.remove(key)
// cacheUtils.clear(keyPrefix?)

const PREFIX = 'pcmap:';

const now = () => Math.floor(Date.now() / 1000);

function readRaw(key) {
	try {
		const k = PREFIX + key;
		const raw = localStorage.getItem(k);
		return raw ? JSON.parse(raw) : null;
	} catch (e) {
		return null;
	}
}

function writeRaw(key, obj) {
	try {
		const k = PREFIX + key;
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
			localStorage.removeItem(PREFIX + key);
		} catch (_) {}
	},

	clear(prefix = '') {
		try {
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
