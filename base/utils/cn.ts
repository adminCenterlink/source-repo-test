import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스를 안전하게 병합하는 유틸리티
 * - 조건부 클래스 + Tailwind 충돌 처리
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-blue-500", "px-6") // "py-2 bg-blue-500 px-6"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
