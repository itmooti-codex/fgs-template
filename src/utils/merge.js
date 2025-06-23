export function mergeObjects(oldObj = {}, newObj = {}) {
  const result = { ...oldObj };
  for (const [key, val] of Object.entries(newObj)) {
    if (val === null || val === undefined) {
      continue;
    }
    if (Array.isArray(val)) {
      const oldArr = Array.isArray(oldObj[key]) ? oldObj[key] : [];
      result[key] = mergeLists(oldArr, val);
    } else if (typeof val === 'object') {
      result[key] = mergeObjects(oldObj[key] || {}, val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function mergeLists(oldList = [], newList = [], idKey = 'id') {
  const map = new Map();
  for (const item of oldList) {
    if (item && item[idKey] != null) {
      map.set(item[idKey], item);
    }
  }
  for (const item of newList) {
    if (!item || item[idKey] == null) continue;
    const existing = map.get(item[idKey]);
    map.set(item[idKey], mergeObjects(existing || {}, item));
  }
  return Array.from(map.values());
}
