#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import { runAdd } from "./commands/add.js";
import { runDiff } from "./commands/diff.js";
import { runInit } from "./commands/init.js";
import { runList } from "./commands/list.js";
/**
 * CP Source Registry CLI 엔트리포인트
 */
const program = new Command();
program
    .name("cp-cli")
    .description("CP Source Registry CLI - 소스 복사 방식의 모듈 레지스트리 도구")
    .version("0.1.0");
program
    .command("init")
    .description("새 프로젝트 초기화 (템플릿 + 모듈 + 라우팅)")
    .option("--from <path>", "project-map.json 파일 경로")
    .option("--target-dir <dir>", "타겟 디렉터리 강제 지정")
    .option("--skip-install", "npm install 스킵")
    .action(async (opts) => {
    try {
        await runInit({
            from: opts.from,
            targetDir: opts.targetDir,
            skipInstall: opts.skipInstall,
        });
    }
    catch (e) {
        printError(e);
        process.exit(1);
    }
});
program
    .command("add [moduleName]")
    .description("모듈 추가 (의존 모듈 자동 포함)")
    .option("--category <name>", "카테고리 전체 추가")
    .option("--force", "이미 존재해도 덮어쓰기")
    .option("--as <path>", "타겟에서 사용할 경로 별칭")
    .option("--cwd <dir>", "타겟 디렉터리 (기본: 현재 디렉터리)")
    .action(async (moduleName, opts) => {
    try {
        await runAdd(moduleName, {
            category: opts.category,
            force: opts.force,
            as: opts.as,
            cwd: opts.cwd,
        });
    }
    catch (e) {
        printError(e);
        process.exit(1);
    }
});
program
    .command("list")
    .description("모듈 목록 조회")
    .option("--layer <n>", "레이어 필터 (0/1/2/3)")
    .option("--category <name>", "카테고리 필터")
    .option("--tag <name>", "태그 필터")
    .option("--installed", "타겟에 설치된 모듈만")
    .option("--cwd <dir>", "타겟 디렉터리 (기본: 현재 디렉터리)")
    .action(async (opts) => {
    try {
        await runList({
            layer: opts.layer,
            category: opts.category,
            tag: opts.tag,
            installed: opts.installed,
            cwd: opts.cwd,
        });
    }
    catch (e) {
        printError(e);
        process.exit(1);
    }
});
program
    .command("diff [moduleName]")
    .description("source repo와 타겟 파일의 차이 비교")
    .option("--all", "설치된 모든 모듈 비교")
    .option("--cwd <dir>", "타겟 디렉터리 (기본: 현재 디렉터리)")
    .action(async (moduleName, opts) => {
    try {
        await runDiff(moduleName, { all: opts.all, cwd: opts.cwd });
    }
    catch (e) {
        printError(e);
        process.exit(1);
    }
});
program.parseAsync(process.argv);
function printError(e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(chalk.red(`\n✗ ${msg}`));
}
//# sourceMappingURL=index.js.map