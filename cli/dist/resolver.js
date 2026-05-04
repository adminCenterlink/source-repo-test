/**
 * registryDependencies 재귀 해결
 * - 중복 제거 (Set 기반)
 * - 순환 참조 감지 (DFS visiting set)
 * - 위상 정렬 결과 반환 (의존하는 것이 먼저 오도록)
 */
export function resolveDependencies(registry, rootModuleNames) {
    const resolved = [];
    const resolvedNames = new Set();
    const visiting = new Set();
    function visit(name, stack) {
        if (resolvedNames.has(name))
            return;
        if (visiting.has(name)) {
            const cycle = [...stack, name].join(" -> ");
            throw new Error(`순환 참조 감지: ${cycle}`);
        }
        const mod = registry.modules[name];
        if (!mod) {
            throw new Error(`'${stack[stack.length - 1] ?? "(root)"}'의 의존 모듈 '${name}'을 registry에서 찾을 수 없습니다.`);
        }
        visiting.add(name);
        for (const dep of mod.registryDependencies) {
            visit(dep, [...stack, name]);
        }
        visiting.delete(name);
        resolvedNames.add(name);
        resolved.push(mod);
    }
    for (const name of rootModuleNames) {
        visit(name, []);
    }
    return resolved;
}
/** 모듈 묶음에서 npmDependencies를 병합한다 (충돌 시 마지막 값 유지) */
export function mergeNpmDeps(modules) {
    const merged = {};
    for (const m of modules) {
        for (const [pkg, version] of Object.entries(m.npmDependencies)) {
            merged[pkg] = version;
        }
    }
    return merged;
}
//# sourceMappingURL=resolver.js.map