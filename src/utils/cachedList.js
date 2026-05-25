const listCache = new Map();
const listPromises = new Map();

export const getCachedList = async (key, loader) => {
	if (listCache.has(key)) return listCache.get(key);

	if (!listPromises.has(key)) {
		listPromises.set(
			key,
			Promise.resolve()
				.then(loader)
				.then((response) => {
					const list = Array.isArray(response) ? response : response?.data ?? [];
					listCache.set(key, list);
					return list;
				})
				.finally(() => {
					listPromises.delete(key);
				})
		);
	}

	return listPromises.get(key);
};

export const clearCachedList = (key) => {
	if (typeof key === "string") {
		listCache.delete(key);
		listPromises.delete(key);
		return;
	}

	listCache.clear();
	listPromises.clear();
};