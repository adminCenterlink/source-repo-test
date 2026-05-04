/**
 * 한국 형식 포매팅 유틸리티
 */

/**
 * 날짜를 한국 형식 문자열로 변환한다.
 * @param value - Date 객체 또는 ISO 8601 문자열
 * @param withTime - 시간 포함 여부
 *
 * @example
 * formatDate(new Date()) // "2026년 4월 29일"
 * formatDate(new Date(), true) // "2026년 4월 29일 14:30"
 */
export function formatDate(value: Date | string | number, withTime = false): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (!withTime) {
    return `${y}년 ${m}월 ${d}일`;
  }
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}년 ${m}월 ${d}일 ${hh}:${mm}`;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환한다 (input[type=date] 호환).
 */
export function formatDateISO(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 한국 전화번호 포맷
 * - 10자리: 010-1234-5678 / 02-123-4567
 * - 11자리: 010-1234-5678
 *
 * @example
 * formatPhone("01012345678") // "010-1234-5678"
 * formatPhone("0212345678") // "02-1234-5678"
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    if (digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return phone;
}

/**
 * 금액을 원화 문자열로 변환
 *
 * @example
 * formatCurrency(1234567) // "1,234,567원"
 */
export function formatCurrency(amount: number, withUnit = true): string {
  const formatted = amount.toLocaleString("ko-KR");
  return withUnit ? `${formatted}원` : formatted;
}

/**
 * 숫자에 천 단위 구분기호를 추가
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}
