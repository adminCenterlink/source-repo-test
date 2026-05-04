import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { simpleGit } from "simple-git";

/**
 * source repo clone/pull + 로컬 캐시 관리 (~/.cp-cache/)
 *
 * PoC: 환경변수 CP_SOURCE_REPO_URL 또는 CP_SOURCE_LOCAL_PATH 가 지정되어 있으면 사용
 *      없으면 부모 디렉터리의 source-repo 를 fallback으로 사용 (개발 편의)
 */

const CACHE_ROOT = path.join(os.homedir(), ".cp-cache");
const REPO_DIR_NAME = "source-repo";

/** 캐시 루트 보장 */
async function ensureCacheRoot(): Promise<string> {
  await fs.mkdir(CACHE_ROOT, { recursive: true });
  return CACHE_ROOT;
}

/** 디렉터리 존재 여부 확인 */
async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * source repo를 가져온다.
 * 1) CP_SOURCE_LOCAL_PATH 환경변수가 있으면 그 경로를 그대로 사용
 * 2) CP_SOURCE_REPO_URL 환경변수가 있으면 ~/.cp-cache/source-repo 에 clone/pull
 * 3) 없으면 process.cwd()에서 source-repo 디렉터리를 검색 (PoC 폴백)
 *
 * @returns source repo 절대 경로와 commit hash
 */
export async function ensureSourceRepo(): Promise<{ root: string; commitHash: string }> {
  const localPath = process.env.CP_SOURCE_LOCAL_PATH;
  if (localPath && (await exists(localPath))) {
    const commitHash = await readCommitHash(localPath);
    return { root: localPath, commitHash };
  }

  const repoUrl = process.env.CP_SOURCE_REPO_URL;
  if (repoUrl) {
    await ensureCacheRoot();
    const repoPath = path.join(CACHE_ROOT, REPO_DIR_NAME);
    if (await exists(repoPath)) {
      const git = simpleGit(repoPath);
      try {
        await git.pull();
      } catch {
        // 네트워크 실패 시 캐시 그대로 사용
      }
    } else {
      await simpleGit().clone(repoUrl, repoPath, ["--depth", "1"]);
    }
    const commitHash = await readCommitHash(repoPath);
    return { root: repoPath, commitHash };
  }

  // PoC 폴백: 현재 디렉터리에서 source-repo 탐색
  const candidates = [
    path.join(process.cwd(), "source-repo"),
    path.join(process.cwd(), "..", "source-repo"),
    path.join(process.cwd(), "..", "..", "source-repo"),
  ];
  for (const candidate of candidates) {
    if (await exists(path.join(candidate, "registry.json"))) {
      const commitHash = await readCommitHash(candidate);
      return { root: candidate, commitHash };
    }
  }

  throw new Error(
    "source repo를 찾을 수 없습니다. CP_SOURCE_LOCAL_PATH 또는 CP_SOURCE_REPO_URL 환경변수를 설정하세요.",
  );
}

/** 디렉터리의 git commit hash 읽기 (git이 아니면 'local-dev' 반환) */
async function readCommitHash(dir: string): Promise<string> {
  try {
    const git = simpleGit(dir);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return "local-dev";
    const log = await git.log({ maxCount: 1 });
    return log.latest?.hash.slice(0, 12) ?? "local-dev";
  } catch {
    return "local-dev";
  }
}
