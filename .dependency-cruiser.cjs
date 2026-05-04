/**
 * dependency-cruiser 설정
 * - 레이어 간 의존성 규칙 검증
 *
 * 레이어:
 *   base/        : Layer 0 (어떤 상위 레이어도 참조 불가)
 *   components/ui/    : Layer 1 (base 만 참조 가능)
 *   components/domain/: Layer 2 (base, components/ui 참조 가능)
 *   views/       : Layer 3 (base, components/ui, components/domain 참조 가능, 페이지 간 교차 의존 금지)
 */
module.exports = {
  forbidden: [
    {
      name: "base-no-upstream",
      severity: "error",
      comment: "base는 components/, views/를 의존할 수 없습니다.",
      from: { path: "^base/" },
      to: { path: "^(components|views)/" },
    },
    {
      name: "ui-no-pages",
      severity: "error",
      comment: "components/ui는 views/를 의존할 수 없습니다.",
      from: { path: "^components/ui/" },
      to: { path: "^views/" },
    },
    {
      name: "ui-no-domain",
      severity: "error",
      comment: "components/ui는 components/domain/을 의존할 수 없습니다.",
      from: { path: "^components/ui/" },
      to: { path: "^components/domain/" },
    },
    {
      name: "domain-no-pages",
      severity: "error",
      comment: "components/domain은 views/를 의존할 수 없습니다.",
      from: { path: "^components/domain/" },
      to: { path: "^views/" },
    },
    {
      name: "pages-no-cross-pages",
      severity: "error",
      comment: "pages 모듈끼리는 서로 의존할 수 없습니다 (카테고리 내/외 모두).",
      from: { path: "^views/([^/]+)/([^/]+)/" },
      to: {
        path: "^views/",
        pathNot: "^views/$1/$2/",
      },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "순환 의존 금지",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
