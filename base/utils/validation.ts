/**
 * 검증 유틸리티 (한국 비즈니스 환경 기준)
 */

/** 이메일 형식 검증 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 한국 전화번호 검증
 * - 휴대전화: 010-XXXX-XXXX
 * - 서울 지역번호: 02-XXX(X)-XXXX
 * - 기타 지역번호: 0XX-XXX(X)-XXXX
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 11) return false;
  if (digits.startsWith("010") && digits.length === 11) return true;
  if (digits.startsWith("02") && (digits.length === 9 || digits.length === 10)) return true;
  if (/^0[3-9]\d/.test(digits) && (digits.length === 10 || digits.length === 11)) return true;
  return false;
}

/**
 * 사업자등록번호 검증 (체크섬 포함)
 * @see https://www.nts.go.kr 의 검증 알고리즘 참조
 */
export function isValidBusinessNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return false;

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * weights[i];
  }
  sum += Math.floor((Number(digits[8]) * 5) / 10);
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === Number(digits[9]);
}

/** 주민등록번호 형식 검증 (앞 6자리 - 뒤 7자리, 체크섬 미포함) */
export function isValidResidentNumberFormat(value: string): boolean {
  const re = /^\d{6}-?\d{7}$/;
  return re.test(value);
}

/** 빈 값 체크 (null, undefined, "", "  ") */
export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}
