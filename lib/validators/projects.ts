import { z } from 'zod';

const isoDate = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, 'YYYY-MM-DD形式で入力してください');
const projectStatusEnum = z.enum(['planning', 'active', 'completed', 'on_hold']);

const baseProjectFields = {
  name: z.string().min(1, 'プロジェクト名を入力してください').max(255),
  description: z.string().max(2000).optional(),
  start_date: isoDate,
  end_date: isoDate.optional(),
  notes: z.string().max(4000).optional(),
  status: projectStatusEnum.optional(),
};

export const createProjectSchema = z.object(baseProjectFields);

export const updateProjectSchema = z
  .object({
    ...baseProjectFields,
    name: baseProjectFields.name.optional(),
    start_date: baseProjectFields.start_date.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: '少なくとも1項目を指定してください',
  });
