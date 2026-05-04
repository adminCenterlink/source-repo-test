import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { copyModule } from "../copier.js";
import { ensureSourceRepo } from "../git.js";
import {
  loadRegistry,
  type ModuleEntry,
  type Registry,
} from "../registry.js";
import { mergeNpmDeps, resolveDependencies } from "../resolver.js";
import { writeLock, type InstalledModule, type LockFile } from "../lock.js";

interface ProjectMapView {
  module: string;
  route: string;
}

interface ProjectMap {
  projectName: string;
  description?: string;
  views: ProjectMapView[];
  additionalModules?: string[];
  options?: {
    includeTests?: boolean;
    targetDir?: string;
    skipNpmInstall?: boolean;
  };
}

export interface InitOptions {
  from?: string;
  /** npm install 스킵 (테스트 용이성) */
  skipInstall?: boolean;
  /** 타겟 디렉터리 강제 지정 */
  targetDir?: string;
}

/**
 * `init` 명령
 * - source repo를 가져오고
 * - 템플릿 복사 + 모듈 복사 + 라우팅 자동 생성 + lock 파일 생성 + npm install
 */
export async function runInit(options: InitOptions): Promise<void> {
  const { root: sourceRoot, commitHash } = await ensureSourceRepo();
  const registry = await loadRegistry(sourceRoot);

  let projectMap: ProjectMap;
  if (options.from) {
    projectMap = await readProjectMap(options.from);
  } else {
    projectMap = await runInteractiveInit(registry);
  }

  const targetDir = path.resolve(
    options.targetDir ?? projectMap.options?.targetDir ?? `./${projectMap.projectName}`,
  );

  console.log(chalk.cyan(`\n→ 타겟 디렉터리: ${targetDir}`));
  await fs.mkdir(targetDir, { recursive: true });

  // 1) 템플릿 복사
  const tplSpinner = ora("템플릿 복사 중...").start();
  await copyTemplates(sourceRoot, targetDir, projectMap.projectName);
  tplSpinner.succeed("템플릿 복사 완료");

  // 2) 모듈 의존성 해결
  // - base/styles는 templates/app/layout.tsx가 globals.css를 import 하므로 항상 포함
  const rootModules = [
    "base/styles",
    ...projectMap.views.map((p) => p.module),
    ...(projectMap.additionalModules ?? []),
  ];
  const resolvedSpinner = ora("모듈 의존성 해결 중...").start();
  const resolved = resolveDependencies(registry, rootModules);
  resolvedSpinner.succeed(`총 ${resolved.length}개 모듈 해결됨`);

  // 3) 모듈 복사
  const copySpinner = ora("모듈 복사 중...").start();
  const installed: Record<string, InstalledModule> = {};
  for (const mod of resolved) {
    const result = await copyModule(sourceRoot, targetDir, mod, { force: true });
    installed[result.asPath] = {
      name: mod.name,
      asPath: result.asPath,
      sourceCommit: commitHash,
      installedAt: new Date().toISOString(),
      fileHashes: result.fileHashes,
    };
  }
  copySpinner.succeed("모듈 복사 완료");

  // 4) package.json 병합
  const pkgSpinner = ora("package.json 병합 중...").start();
  await mergePackageJson(targetDir, registry, resolved, projectMap.projectName);
  pkgSpinner.succeed("package.json 병합 완료");

  // 5) 라우팅 파일 생성
  const routeSpinner = ora("라우팅 파일 생성 중...").start();
  await generateRoutes(targetDir, registry, projectMap.views);
  routeSpinner.succeed(`${projectMap.views.length}개 라우트 생성 완료`);

  // 6) .registry-lock.json 작성
  const lock: LockFile = {
    registryVersion: registry.version,
    updatedAt: new Date().toISOString(),
    modules: installed,
  };
  await writeLock(targetDir, lock);
  console.log(chalk.green("✓ .registry-lock.json 작성 완료"));

  // 7) dependency-cruiser 설정 복사 (있다면)
  await copyDepCruiserConfig(sourceRoot, targetDir);

  // 8) npm install
  const skipInstall =
    options.skipInstall ?? projectMap.options?.skipNpmInstall ?? false;
  if (skipInstall) {
    console.log(chalk.yellow("→ npm install 스킵 (옵션)"));
  } else {
    console.log(chalk.cyan("\n→ npm install 실행 중..."));
    await runCommand("npm", ["install"], targetDir);
  }

  console.log(chalk.green.bold(`\n✓ 프로젝트 '${projectMap.projectName}' 생성 완료!`));
  console.log(chalk.gray(`  cd ${path.relative(process.cwd(), targetDir) || "."}`));
  console.log(chalk.gray(`  npm run dev`));
}

async function readProjectMap(filePath: string): Promise<ProjectMap> {
  const abs = path.resolve(filePath);
  const content = await fs.readFile(abs, "utf-8");
  return JSON.parse(content) as ProjectMap;
}

async function runInteractiveInit(registry: Registry): Promise<ProjectMap> {
  const { projectName } = await prompts({
    type: "text",
    name: "projectName",
    message: "프로젝트 이름",
    initial: "my-project",
  });

  const views: ProjectMapView[] = [];
  for (const [categoryKey, category] of Object.entries(registry.categories)) {
    const modulesInCategory = Object.values(registry.modules).filter(
      (m) => m.category === categoryKey,
    );
    if (modulesInCategory.length === 0) continue;
    const { selected } = await prompts({
      type: "multiselect",
      name: "selected",
      message: `[${categoryKey}] ${category.description} - 추가할 페이지를 선택하세요`,
      choices: modulesInCategory.map((m) => ({
        title: `${m.name} (${m.customizationLevel})`,
        value: m.name,
      })),
    });
    for (const moduleName of selected as string[]) {
      const segment = moduleName.split("/").slice(1).join("/"); // "consult/consult-list"
      views.push({ module: moduleName, route: `/${segment}` });
    }
  }

  return {
    projectName: projectName ?? "my-project",
    views,
    options: { targetDir: `./${projectName ?? "my-project"}` },
  };
}

async function copyTemplates(
  sourceRoot: string,
  targetDir: string,
  projectName: string,
): Promise<void> {
  const tplRoot = path.join(sourceRoot, "templates");
  await copyDirRecursive(tplRoot, targetDir, projectName);
  // package.json.template -> package.json (변환 + 이동)
  const tplPkg = path.join(targetDir, "package.json.template");
  try {
    const raw = await fs.readFile(tplPkg, "utf-8");
    const replaced = raw.replace(/{{PROJECT_NAME}}/g, projectName);
    await fs.writeFile(path.join(targetDir, "package.json"), replaced, "utf-8");
    await fs.unlink(tplPkg);
  } catch {
    // 이미 처리됨 또는 없음
  }
}

async function copyDirRecursive(
  src: string,
  dst: string,
  projectName: string,
): Promise<void> {
  const entries = await fs.readdir(src, { withFileTypes: true });
  await fs.mkdir(dst, { recursive: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, dstPath, projectName);
    } else {
      const buf = await fs.readFile(srcPath);
      // 텍스트 파일이면 토큰 치환
      if (/\.(ts|tsx|json|js|jsx|md|css|mjs|template)$/i.test(entry.name)) {
        const replaced = buf.toString("utf-8").replace(/{{PROJECT_NAME}}/g, projectName);
        await fs.writeFile(dstPath, replaced, "utf-8");
      } else {
        await fs.writeFile(dstPath, buf);
      }
    }
  }
}

async function mergePackageJson(
  targetDir: string,
  registry: Registry,
  resolved: ModuleEntry[],
  projectName: string,
): Promise<void> {
  const pkgPath = path.join(targetDir, "package.json");
  const raw = await fs.readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(raw) as {
    name: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    [key: string]: unknown;
  };
  pkg.name = projectName;
  pkg.dependencies = pkg.dependencies ?? {};
  const moduleDeps = mergeNpmDeps(resolved);
  pkg.dependencies = { ...pkg.dependencies, ...moduleDeps };
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), "utf-8");
}

async function generateRoutes(
  targetDir: string,
  registry: Registry,
  pages: ProjectMapView[],
): Promise<void> {
  for (const p of pages) {
    const mod = registry.modules[p.module];
    if (!mod) continue;
    const routeSegment = p.route.replace(/^\//, "");
    const routeDir = path.join(targetDir, "app", routeSegment);
    await fs.mkdir(routeDir, { recursive: true });

    const importPath = `@/${mod.name}/page`;
    const alias = pascalize(mod.name.split("/").pop() ?? "Page") + "Module";

    const code = `// 자동 생성된 라우팅 파일 - CP CLI init
import ${alias} from "${importPath}";

export default function Page() {
  return <${alias} />;
}
`;
    await fs.writeFile(path.join(routeDir, "page.tsx"), code, "utf-8");
  }

  // app/page.tsx (루트 홈) - 생성된 라우트 링크 목록
  await generateHomePage(targetDir, pages);
}

async function generateHomePage(
  targetDir: string,
  pages: ProjectMapView[],
): Promise<void> {
  const routeEntries = pages
    .map((p) => {
      const label = pascalize(p.module.split("/").pop() ?? p.route)
        .replace(/([A-Z])/g, " $1")
        .trim();
      return `  { href: "${p.route}", label: "${label}", description: "${p.module}" }`;
    })
    .join(",\n");

  const code = `import Link from "next/link";

const routes = [
${routeEntries},
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-12">
      <h1 className="text-3xl font-bold text-gray-900">Sample Project</h1>
      <ul className="flex flex-col gap-3 w-full max-w-sm">
        {routes.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="flex flex-col rounded-md border border-gray-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"
            >
              <span className="font-semibold text-blue-600">{r.label}</span>
              <span className="text-sm text-gray-500">{r.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;
  await fs.writeFile(path.join(targetDir, "app", "page.tsx"), code, "utf-8");
}

function pascalize(s: string): string {
  return s
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

async function copyDepCruiserConfig(sourceRoot: string, targetDir: string): Promise<void> {
  const candidates = [
    path.join(sourceRoot, ".dependency-cruiser.cjs"),
    path.join(sourceRoot, "..", ".dependency-cruiser.cjs"),
  ];
  for (const c of candidates) {
    try {
      const buf = await fs.readFile(c);
      await fs.writeFile(path.join(targetDir, ".dependency-cruiser.cjs"), buf);
      return;
    } catch {
      // 다음 후보로
    }
  }
}

function runCommand(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} 실패 (exit ${code})`));
    });
  });
}
