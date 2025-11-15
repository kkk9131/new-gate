import { z } from 'zod';

const uuidSchema = z.string().uuid('UUID形式で入力してください');
const isoDate = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, 'YYYY-MM-DD形式で入力してください');
const currencySchema = z.string().regex(/^[A-Z]{3}$/u, 'ISO通貨コードを指定してください');

const baseRevenueFields = {
  project_id: uuidSchema.optional(),
  amount: z.number().min(0, '金額は0以上で指定してください'),
  tax_amount: z.number().min(0).optional(),
  tax_included: z.boolean().optional(),
  currency: currencySchema.optional(),
  revenue_date: isoDate,
  payment_date: isoDate.optional(),
  description: z.string().optional(),
  category: z.string().max(100).optional(),
};

export const createRevenueSchema = z.object(baseRevenueFields);

export const updateRevenueSchema = z
  .object({
    ...baseRevenueFields,
    amount: baseRevenueFields.amount.optional(),
    revenue_date: baseRevenueFields.revenue_date.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: '少なくとも1項目を指定してください',
  });
