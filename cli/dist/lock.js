import fs from "node:fs/promises";
import path from "node:path";
const LOCK_FILE = ".registry-lock.json";
export async function readLock(targetRoot) {
    try {
        const content = await fs.readFile(path.join(targetRoot, LOCK_FILE), "utf-8");
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
export async function writeLock(targetRoot, lock) {
    const filePath = path.join(targetRoot, LOCK_FILE);
    const content = JSON.stringify(lock, null, 2);
    await fs.writeFile(filePath, content, "utf-8");
}
export function lockPath(targetRoot) {
    return path.join(targetRoot, LOCK_FILE);
}
//# sourceMappingURL=lock.js.map