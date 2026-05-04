import fs from "node:fs/promises";
import path from "node:path";

/**
 * .registry-lock.json 의 read/write
 * - 설치된 모듈, source commit hash, 파일별 sha256 hash 기록
 */

export interface InstalledModule {
  /** registry 모듈명 */
  name: string;
  /** 타겟에서의 경로 (--as 적용 후) */
  asPath: string;
  /** 설치 시점의 source commit hash */
  sourceCommit: string;
  /** 설치 시점 ISO 문자열 */
  installedAt: string;
  /** 파일 경로 (target 기준) -> sha256 */
  fileHashes: Record<string, string>;
}

export interface LockFile {
  /** registry 자체 버전 */
  registryVersion: string;
  /** 마지막 갱신 시각 */
  updatedAt: string;
  /** 설치된 모듈 목록 (key = asPath) */
  modules: Record<string, InstalledModule>;
}

const LOCK_FILE = ".registry-lock.json";

export async function readLock(targetRoot: string): Promise<LockFile | null> {
  try {
    const content = await fs.readFile(path.join(targetRoot, LOCK_FILE), "utf-8");
    return JSON.parse(content) as LockFile;
  } catch {
    return null;
  }
}

export async function writeLock(targetRoot: string, lock: LockFile): Promise<void> {
  const filePath = path.join(targetRoot, LOCK_FILE);
  const content = JSON.stringify(lock, null, 2);
  await fs.writeFile(filePath, content, "utf-8");
}

export function lockPath(targetRoot: string): string {
  return path.join(targetRoot, LOCK_FILE);
}
