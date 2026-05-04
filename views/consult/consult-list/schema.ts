import { z } from "zod";

/** 상담 목록 검색 폼 검증 스키마 */
export const consultListSearchSchema = z
  .object({
    keyword: z.string().max(50).optional(),
    status: z.enum(["ALL", "PENDING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
    fromDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD 입니다")
      .optional()
      .or(z.literal("")),
    toDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD 입니다")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.fromDate || !data.toDate) return true;
      return data.fromDate <= data.toDate;
    },
    { message: "시작일은 종료일보다 이전이어야 합니다", path: ["fromDate"] },
  );

export type ConsultListSearchInput = z.infer<typeof consultListSearchSchema>;
