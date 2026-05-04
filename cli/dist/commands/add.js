import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { copyModule } from "../copier.js";
import { ensureSourceRepo } from "../git.js";
import { getModulesByCategory, loadRegistry } from "../registry.js";
import { resolveDependencies } from "../resolver.js";
import { readLock, writeLock } from "../lock.js";
/**
 * `add` 명령
 * - 단일 모듈 또는 카테고리 전체 추가
 * - 의존 모듈도 함께 복사
 * - --as 지정 시 root 모듈만 별칭 경로로 복사 (의존 모듈은 원래 이름 유지)
 */
export async function runAdd(moduleName, options) {
    const targetRoot = path.resolve(options.cwd ?? process.cwd());
    const { root: sourceRoot, commitHash } = await ensureSourceRepo();
    const registry = await loadRegistry(sourceRoot);
    // 추가할 root 모듈 결정
    let rootModules;
    if (options.category) {
        rootModules = getModulesByCategory(registry, options.category);
        if (rootModules.length === 0) {
            throw new Error(`'${options.category}' 카테고리에 속한 모듈이 없습니다.`);
        }
        if (options.as) {
            throw new Error("--category와 --as 는 함께 사용할 수 없습니다.");
        }
        console.log(chalk.cyan(`→ '${options.category}' 카테고리: ${rootModules.length}개 모듈 추가`));
    }
    else if (moduleName) {
        rootModules = [registry.modules[moduleName]];
        if (!rootModules[0]) {
            throw new Error(`registry에 '${moduleName}' 모듈이 없습니다.`);
        }
    }
    else {
        throw new Error("모듈명 또는 --category 옵션을 지정해주세요.");
    }
    // 의존성 해결
    const resolveSpinner = ora("의존성 해결 중...").start();
    const allResolved = resolveDependencies(registry, rootModules.map((m) => m.name));
    resolveSpinner.succeed(`총 ${allResolved.length}개 모듈 (의존 포함)`);
    // 기존 lock 로드
    const lock = (await readLock(targetRoot)) ?? {
        registryVersion: registry.version,
        updatedAt: new Date().toISOString(),
        modules: {},
    };
    // 복사
    const copySpinner = ora("모듈 복사 중...").start();
    for (const mod of allResolved) {
        // --as 옵션은 root 모듈에만 적용
        const isRoot = rootModules.length === 1 && mod.name === rootModules[0].name && Boolean(options.as);
        const asPath = isRoot ? options.as : mod.name;
        // 이미 lock에 등록되어 있고 force 아님 + as 변경 없음 -> 스킵
        if (!options.force && lock.modules[asPath ?? mod.name]) {
            continue;
        }
        const result = await copyModule(sourceRoot, targetRoot, mod, {
            asPath,
            force: options.force,
        });
        const installed = {
            name: mod.name,
            asPath: result.asPath,
            sourceCommit: commitHash,
            installedAt: new Date().toISOString(),
            fileHashes: result.fileHashes,
        };
        lock.modules[result.asPath] = installed;
    }
    copySpinner.succeed("복사 완료");
    // lock 업데이트
    lock.registryVersion = registry.version;
    lock.updatedAt = new Date().toISOString();
    await writeLock(targetRoot, lock);
    console.log(chalk.green(`\n✓ ${rootModules.map((m) => m.name).join(", ")} 추가 완료`));
}
//# sourceMappingURL=add.js.map