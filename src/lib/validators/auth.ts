import { z } from 'zod';

/**
 * 認證相關表單驗證。
 * 同一份 schema 同時供前端即時驗證與送出前檢查，避免重複寫規則。
 */

export const emailField = z
  .string()
  .trim()
  .min(1, '請輸入電郵')
  .email('電郵格式不正確')
  .max(254, '電郵長度不可超過 254 個字元');

/** Firebase 密碼長度上限為 72 個位元組 */
export const passwordField = z
  .string()
  .min(8, '密碼至少 8 個字元')
  .max(72, '密碼不可超過 72 個字元');

export const displayNameField = z
  .string()
  .trim()
  .min(2, '暱稱至少 2 個字元')
  .max(20, '暱稱不可超過 20 個字元');

/** 登入 */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, '請輸入密碼'),
});

/** 註冊 */
export const registerSchema = z
  .object({
    displayName: displayNameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, '請再次輸入密碼'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: '兩次輸入的密碼不一致',
    path: ['confirmPassword'],
  });

/** 忘記密碼 */
export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** 表單欄位錯誤（key = 欄位名） */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * 用 schema 驗證並轉成 FieldErrors。
 * 驗證通過時回傳 { success: true, data }，否則回傳 { success: false, errors }。
 */
export function validateForm<T extends z.ZodType>(
  schema: T,
  values: unknown,
):
  | { success: true; data: z.infer<T> }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}
