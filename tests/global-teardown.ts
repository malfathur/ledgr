import { unlinkSync, existsSync } from 'fs';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '..', 'test.db');

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deleteWithRetry(filePath: string, retries = 30, delayMs = 1000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    if (!existsSync(filePath)) return;
    try {
      unlinkSync(filePath);
      return;
    } catch {
      if (i < retries - 1) await sleep(delayMs);
    }
  }
}

export default async function globalTeardown() {
  await deleteWithRetry(`${DB_PATH}-wal`);
  await deleteWithRetry(`${DB_PATH}-shm`);
  await deleteWithRetry(DB_PATH);
}
