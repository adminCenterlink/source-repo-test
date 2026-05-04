import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { ModuleEntry } from "./registry.js";

/**
 * 파일 복사 엔진 + 해시 생성
 * - 모듈에 정의된 files 배열을 source -> target에 복사
 * - 각 파일의 SHA-256 해시를 계산하여 lock 파일에 기록 가능하도록 반환
 */

export interface CopyResult {
  /** 모듈명 */
  moduleName: string;
  /** 타겟에서 사용한 모듈 경로 (--as 적용 후) */
  asPath: string;
  /** 복사된 파일들의 source 경로 -> 해시 */
  fileHashes: Record<string, string>;
}

/**
 * 모듈을 타겟에 복사한다.
 * @param sourceRoot - source-repo 루트
 * @param targetRoot - 타겟 프로젝트 루트
 * @param mod - 복사할 모듈
 * @param options.asPath - 타겟에서 사용할 모듈 경로 (예: "pages/consult/consult-main")
 *                        지정 시 mod.name을 이 경로로 치환하여 복사
 * @param options.force - 이미 존재하는 파일 덮어쓰기 여부
 */
export async function copyModule(
  sourceRoot: string,
  targetRoot: string,
  mod: ModuleEntry,
  options: { asPath?: string; force?: boolean } = {},
): Promise<CopyResult> {
  const asPath = options.asPath ?? mod.name;
  const fileHashes: Record<string, string> = {};

  for (const relFile of mod.files) {
    const srcAbs = path.join(sourceRoot, relFile);
    const targetRel = options.asPath ? rewritePath(relFile, mod.name, asPath) : relFile;
    const dstAbs = path.join(targetRoot, targetRel);

    if (!options.force) {
      try {
        await fs.access(dstAbs);
        // 이미 존재 - 스킵
        continue;
      } catch {
        // 파일 없음 - 복사 진행
      }
    }

    await fs.mkdir(path.dirname(dstAbs), { recursive: true });
    const buf = await fs.readFile(srcAbs);
    await fs.writeFile(dstAbs, buf);
    fileHashes[targetRel] = sha256(buf);
  }

  return { moduleName: mod.name, asPath, fileHashes };
}

/** source 경로의 mod.name 부분을 asPath로 치환 */
function rewritePath(filePath: string, originalName: string, asPath: string): string {
  if (filePath.startsWith(`${originalName}/`)) {
    return `${asPath}/${filePath.slice(originalName.length + 1)}`;
  }
  return filePath;
}

/** 버퍼의 SHA-256 해시 */
export function sha256(buf: Buffer | string): string {
  return createHash("sha256").update(buf).digest("hex");
}

/** 타겟에 있는 파일의 SHA-256 해시 (없으면 null) */
export async function hashFile(absPath: string): Promise<string | null> {
  try {
    const buf = await fs.readFile(absPath);
    return sha256(buf);
  } catch {
    return null;
  }
}
