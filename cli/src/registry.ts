import fs from "node:fs/promises";
import path from "node:path";

/**
 * registry.json 파싱 및 모듈 조회 유틸리티
 */

export type CustomizationLevel = "low" | "medium" | "high";

export interface ModuleEntry {
  name: string;
  /** 0=base, 1=ui, 2=domain, 3=pages */
  layer: 0 | 1 | 2 | 3;
  category: string | null;
  description: string;
  files: string[];
  registryDependencies: string[];
  npmDependencies: Record<string, string>;
  tags: string[];
  customizationLevel: CustomizationLevel;
}

export interface CategoryEntry {
  description: string;
}

export interface Registry {
  name: string;
  version: string;
  categories: Record<string, CategoryEntry>;
  modules: Record<string, ModuleEntry>;
}

/** registry.json 로드 */
export async function loadRegistry(sourceRoot: string): Promise<Registry> {
  const registryPath = path.join(sourceRoot, "registry.json");
  const content = await fs.readFile(registryPath, "utf-8");
  const parsed = JSON.parse(content) as Registry;
  return parsed;
}

/** 단일 모듈 조회 - 없으면 에러 */
export function getModule(registry: Registry, name: string): ModuleEntry {
  const mod = registry.modules[name];
  if (!mod) {
    throw new Error(`registry에 '${name}' 모듈이 없습니다.`);
  }
  return mod;
}

/** 카테고리에 속한 모듈 목록 (Layer 3 한정) */
export function getModulesByCategory(registry: Registry, category: string): ModuleEntry[] {
  return Object.values(registry.modules).filter((m) => m.category === category);
}

/** 레이어별 모듈 목록 */
export function getModulesByLayer(registry: Registry, layer: number): ModuleEntry[] {
  return Object.values(registry.modules).filter((m) => m.layer === layer);
}

/** 태그별 모듈 목록 */
export function getModulesByTag(registry: Registry, tag: string): ModuleEntry[] {
  return Object.values(registry.modules).filter((m) => m.tags.includes(tag));
}
