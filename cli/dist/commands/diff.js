import path from "node:path";
import chalk from "chalk";
import { hashFile, sha256 } from "../copier.js";
import fs from "node:fs/promises";
import { ensureSourceRepo } from "../git.js";
import { loadRegistry } from "../registry.js";
import { readLock } from "../lock.js";
/**
 * `diff` 명령
 * - lock에 기록된 hash와 현재 타겟 파일 hash 비교
 * - source repo의 동일 파일 hash도 비교하여 변경 출처 구분
 *
 * 분류:
 *  - 동일: 타겟 = lock = source
 *  - 개발팀 수정: 타겟 ≠ lock,  source = lock
 *  - source 갱신: 타겟 = lock,  source ≠ lock
 *  - 양쪽 모두 변경: 타겟 ≠ lock,  source ≠ lock
 */
export async function runDiff(moduleName, options) {
    const targetRoot = path.resolve(options.cwd ?? process.cwd());
    const lock = await readLock(targetRoot);
    if (!lock) {
        console.log(chalk.yellow("타겟에 .registry-lock.json 이 없습니다. 먼저 init 또는 add를 실행하세요."));
        return;
    }
    const { root: sourceRoot } = await ensureSourceRepo();
    const registry = await loadRegistry(sourceRoot);
    const modulesToCheck = [];
    if (moduleName) {
        const found = Object.values(lock.modules).find((m) => m.name === moduleName || m.asPath === moduleName);
        if (!found) {
            throw new Error(`'${moduleName}'은 설치되지 않은 모듈입니다.`);
        }
        modulesToCheck.push(found);
    }
    else if (options.all) {
        modulesToCheck.push(...Object.values(lock.modules));
    }
    else {
        throw new Error("모듈명 또는 --all 옵션을 지정해주세요.");
    }
    let totalChanged = 0;
    let totalLocal = 0;
    let totalUpstream = 0;
    let totalBoth = 0;
    let totalMissing = 0;
    for (const installed of modulesToCheck) {
        console.log(chalk.cyan.bold(`\n[${installed.asPath}]`));
        if (installed.asPath !== installed.name) {
            console.log(chalk.gray(`  source 모듈: ${installed.name}`));
        }
        console.log(chalk.gray(`  설치 시점: ${installed.installedAt}`));
        console.log(chalk.gray(`  source commit: ${installed.sourceCommit}`));
        const sourceModule = registry.modules[installed.name];
        const diffs = [];
        for (const [fileRel, lockHash] of Object.entries(installed.fileHashes)) {
            const targetHash = await hashFile(path.join(targetRoot, fileRel));
            // source의 대응 파일을 찾는다 (--as 적용된 경우 원본 경로로 변환)
            let sourceRel = null;
            if (sourceModule) {
                sourceRel = mapToSourcePath(fileRel, installed.asPath, installed.name, sourceModule.files);
            }
            let sourceHash = null;
            if (sourceRel) {
                try {
                    const buf = await fs.readFile(path.join(sourceRoot, sourceRel));
                    sourceHash = sha256(buf);
                }
                catch {
                    sourceHash = null;
                }
            }
            diffs.push({ file: fileRel, lockHash, targetHash, sourceHash });
        }
        // 출력
        let modSame = 0;
        for (const d of diffs) {
            const localChanged = d.targetHash !== null && d.targetHash !== d.lockHash;
            const upstreamChanged = d.sourceHash !== null && d.sourceHash !== d.lockHash;
            const missing = d.targetHash === null;
            if (missing) {
                console.log(chalk.red(`  ✗ [삭제됨] ${d.file}`));
                totalMissing += 1;
                totalChanged += 1;
                continue;
            }
            if (!localChanged && !upstreamChanged) {
                modSame += 1;
                continue;
            }
            if (localChanged && !upstreamChanged) {
                console.log(chalk.yellow(`  M [개발팀 수정] ${d.file}`));
                totalLocal += 1;
                totalChanged += 1;
            }
            else if (!localChanged && upstreamChanged) {
                console.log(chalk.blue(`  U [source 갱신] ${d.file}`));
                totalUpstream += 1;
                totalChanged += 1;
            }
            else {
                console.log(chalk.magenta(`  C [양쪽 모두 변경] ${d.file}`));
                totalBoth += 1;
                totalChanged += 1;
            }
        }
        if (modSame > 0) {
            console.log(chalk.gray(`  ${modSame}개 파일 동일`));
        }
    }
    console.log(chalk.cyan.bold("\n=== 변경 요약 ==="));
    console.log(`  변경된 파일 합계: ${totalChanged}개 (개발팀 수정 ${totalLocal}, source 갱신 ${totalUpstream}, 양쪽 ${totalBoth}, 삭제 ${totalMissing})`);
    if (totalChanged === 0) {
        console.log(chalk.green("  ✓ 모든 파일이 lock과 일치합니다."));
    }
}
/**
 * 타겟 파일 경로(asPath 적용)를 source repo의 원래 파일 경로로 변환
 * - asPath와 name이 같으면 그대로 사용
 * - 다르면 path 앞부분만 치환
 */
function mapToSourcePath(targetFileRel, asPath, originalName, sourceFiles) {
    if (asPath === originalName) {
        return targetFileRel;
    }
    if (targetFileRel.startsWith(`${asPath}/`)) {
        const rest = targetFileRel.slice(asPath.length + 1);
        const candidate = `${originalName}/${rest}`;
        if (sourceFiles.includes(candidate))
            return candidate;
        return candidate; // 없어도 후속 read에서 null 처리
    }
    return targetFileRel;
}
//# sourceMappingURL=diff.js.map