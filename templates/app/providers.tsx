"use client";

import type { ReactNode } from "react";

/**
 * 글로벌 Provider
 * - 인증, 테마, 데이터 페칭 등 추후 추가
 */
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
