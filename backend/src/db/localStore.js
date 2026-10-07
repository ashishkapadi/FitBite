import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_PATH = path.join(DATA_DIR, 'fitbite_store.json');

class LocalStore {
  constructor() {
    this.data = {};
    this.isLoaded = false;
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (e) {
        console.error('[LocalStore] Error reading existing store file, initializing fresh:', e.message);
        this.data = {};
      }
    } else {
      this.data = {};
      this.save();
    }
    this.isLoaded = true;
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[LocalStore] Error saving store:', e.message);
    }
  }

  getTable(tableName) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    return this.data[tableName];
  }

  find(tableName, predicate = () => true) {
    const table = this.getTable(tableName);
    return table.filter(predicate).map(r => ({ ...r }));
  }

  findOne(tableName, predicate = () => true) {
    const table = this.getTable(tableName);
    const row = table.find(predicate);
    return row ? { ...row } : null;
  }

  insert(tableName, row) {
    const table = this.getTable(tableName);
    const newRow = { ...row };
    table.push(newRow);
    this.save();
    return newRow;
  }

  update(tableName, predicate, updates) {
    const table = this.getTable(tableName);
    let count = 0;
    for (let i = 0; i < table.length; i++) {
      if (predicate(table[i])) {
        table[i] = { ...table[i], ...updates, updated_at: new Date().toISOString() };
        count++;
      }
    }
    if (count > 0) this.save();
    return count;
  }

  delete(tableName, predicate) {
    const table = this.getTable(tableName);
    const initialLen = table.length;
    this.data[tableName] = table.filter(r => !predicate(r));
    const removed = initialLen - this.data[tableName].length;
    if (removed > 0) this.save();
    return removed;
  }

  count(tableName, predicate = () => true) {
    return this.find(tableName, predicate).length;
  }

  clearTable(tableName) {
    this.data[tableName] = [];
    this.save();
  }
}

export const localStore = new LocalStore();
