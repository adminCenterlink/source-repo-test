import fs from "node:fs/promises";
import path from "node:path";
/** registry.json 로드 */
export async function loadRegistry(sourceRoot) {
    const registryPath = path.join(sourceRoot, "registry.json");
    const content = await fs.readFile(registryPath, "utf-8");
    const parsed = JSON.parse(content);
    return parsed;
}
/** 단일 모듈 조회 - 없으면 에러 */
export function getModule(registry, name) {
    const mod = registry.modules[name];
    if (!mod) {
        throw new Error(`registry에 '${name}' 모듈이 없습니다.`);
    }
    return mod;
}
/** 카테고리에 속한 모듈 목록 (Layer 3 한정) */
export function getModulesByCategory(registry, category) {
    return Object.values(registry.modules).filter((m) => m.category === category);
}
/** 레이어별 모듈 목록 */
export function getModulesByLayer(registry, layer) {
    return Object.values(registry.modules).filter((m) => m.layer === layer);
}
/** 태그별 모듈 목록 */
export function getModulesByTag(registry, tag) {
    return Object.values(registry.modules).filter((m) => m.tags.includes(tag));
}
//# sourceMappingURL=registry.js.map