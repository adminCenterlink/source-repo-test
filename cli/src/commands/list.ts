import path from "node:path";
import chalk from "chalk";
import { ensureSourceRepo } from "../git.js";
import {
  loadRegistry,
  type ModuleEntry,
  type Registry,
} from "../registry.js";
import { readLock } from "../lock.js";

export interface ListOptions {
  layer?: string;
  category?: string;
  tag?: string;
  installed?: boolean;
  cwd?: string;
}

/**
 * `list` 명령
 * - source repo의 모든 모듈을 표시
 * - --layer 3 사용 시 카테고리별 그룹핑 + customizationLevel 표시
 * - --installed 시 타겟의 lock 기준으로 필터링
 */
export async function runList(options: ListOptions): Promise<void> {
  const { root: sourceRoot } = await ensureSourceRepo();
  const registry = await loadRegistry(sourceRoot);

  let modules = Object.values(registry.modules);

  if (options.layer !== undefined) {
    const layerNum = Number(options.layer);
    modules = modules.filter((m) => m.layer === layerNum);
  }
  if (options.category) {
    modules = modules.filter((m) => m.category === options.category);
  }
  if (options.tag) {
    modules = modules.filter((m) => m.tags.includes(options.tag!));
  }
  if (options.installed) {
    const targetRoot = path.resolve(options.cwd ?? process.cwd());
    const lock = await readLock(targetRoot);
    if (!lock) {
      console.log(chalk.yellow("타겟에 .registry-lock.json 이 없습니다."));
      return;
    }
    const installedNames = new Set(Object.values(lock.modules).map((m) => m.name));
    modules = modules.filter((m) => installedNames.has(m.name));
  }

  if (modules.length === 0) {
    console.log(chalk.yellow("조건에 해당하는 모듈이 없습니다."));
    return;
  }

  // Layer 3 + 카테고리 그룹핑
  if (options.layer === "3") {
    printGroupedByCategory(modules, registry);
    return;
  }

  // 일반 출력 (레이어별)
  const byLayer = new Map<number, ModuleEntry[]>();
  for (const m of modules) {
    if (!byLayer.has(m.layer)) byLayer.set(m.layer, []);
    byLayer.get(m.layer)!.push(m);
  }

  for (const [layer, mods] of [...byLayer.entries()].sort(([a], [b]) => a - b)) {
    console.log(chalk.cyan.bold(`\n[Layer ${layer}] ${layerName(layer)}`));
    for (const m of mods.sort((a, b) => a.name.localeCompare(b.name))) {
      printModuleLine(m);
    }
  }
}

function printGroupedByCategory(modules: ModuleEntry[], registry: Registry): void {
  const byCategory = new Map<string, ModuleEntry[]>();
  for (const m of modules) {
    const key = m.category ?? "(미분류)";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(m);
  }
  for (const [cat, mods] of [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const desc = registry.categories[cat]?.description ?? "";
    console.log(chalk.cyan.bold(`\n● ${cat} ${chalk.gray(desc)}`));
    for (const m of mods.sort((a, b) => a.name.localeCompare(b.name))) {
      const lvlColor = customizationColor(m.customizationLevel);
      console.log(
        `  ${chalk.white(m.name)}  ${lvlColor(`[${m.customizationLevel}]`)}  ${chalk.gray(m.description)}`,
      );
    }
  }
}

function printModuleLine(m: ModuleEntry): void {
  const lvlColor = customizationColor(m.customizationLevel);
  const tags = m.tags.length > 0 ? chalk.gray(`#${m.tags.join(" #")}`) : "";
  console.log(
    `  ${chalk.white(m.name)}  ${lvlColor(`[${m.customizationLevel}]`)}  ${chalk.gray(m.description)}  ${tags}`,
  );
}

function layerName(layer: number): string {
  switch (layer) {
    case 0:
      return "Base";
    case 1:
      return "UI (원자)";
    case 2:
      return "Domain (조합)";
    case 3:
      return "Pages (화면)";
    default:
      return "Unknown";
  }
}

function customizationColor(level: string) {
  switch (level) {
    case "low":
      return chalk.green;
    case "medium":
      return chalk.yellow;
    case "high":
      return chalk.red;
    default:
      return chalk.white;
  }
}
