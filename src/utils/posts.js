export function removeRawById(arr, id) {
  const idx = arr.findIndex((i) => i.id === id);
  if (idx !== -1) {
    arr.splice(idx, 1);
    return true;
  }
  return false;
}

export function findRawById(arr, id) {
  return arr.find((i) => i.id === id) || null;
}
