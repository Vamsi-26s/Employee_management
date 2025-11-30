// Minimal IndexedDB-based offline queue for attendance actions
const DB_NAME = 'attendx_offline';
const STORE = 'queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(action) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({ ...action, createdAt: Date.now() });
    await tx.complete;
    db.close();
  } catch (e) {
    console.warn('IndexedDB enqueue failed, falling back to localStorage', e);
    const key = 'attendx_queue';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({ ...action, createdAt: Date.now() });
    localStorage.setItem(key, JSON.stringify(list));
  }
}

export async function drain(processor) {
  // Try IndexedDB first
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getAllReq = store.getAll();
    const records = await new Promise((resolve, reject) => {
      getAllReq.onsuccess = () => resolve(getAllReq.result || []);
      getAllReq.onerror = () => reject(getAllReq.error);
    });
    for (const rec of records) {
      await processor(rec);
      store.delete(rec.id);
    }
    await tx.complete;
    db.close();
  } catch (e) {
    console.warn('IndexedDB drain failed, falling back to localStorage', e);
    const key = 'attendx_queue';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const remaining = [];
    for (const rec of list) {
      try {
        await processor(rec);
      } catch (err) {
        remaining.push(rec);
      }
    }
    localStorage.setItem(key, JSON.stringify(remaining));
  }
}