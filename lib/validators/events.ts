import { z } from 'zod';

const uuidSchema = z.string().uuid('UUID形式で入力してください');
const isoDateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'ISO 8601形式の日付時刻で入力してください',
});
const colorHex = z.string().regex(/^#([0-9A-Fa-f]{6})$/u, '#RRGGBB形式のカラーコードを指定してください');

const dayOfWeekEnum = z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);
const recurrenceFrequencyEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);
const reminderTypeEnum = z.enum(['notification', 'email']);

const recurrenceSchema = z.object({
  frequency: recurrenceFrequencyEnum,
  interval: z.number().int().min(1).default(1),
  count: z.number().int().min(1).optional(),
  until_date: isoDateTime.optional(),
  by_day: z.array(dayOfWeekEnum).min(1).optional(),
  by_month_day: z.array(z.number().int().min(-31).max(31)).min(1).optional(),
  excluded_dates: z.array(isoDateTime).optional(),
});

const reminderSchema = z.object({
  reminder_type: reminderTypeEnum.default('notification'),
  minutes_before: z.number().int().min(0),
});

const baseEventFields = {
  project_id: uuidSchema.optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: isoDateTime,
  end_time: isoDateTime,
  all_day: z.boolean().optional(),
  timezone: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  color: colorHex.optional(),
  recurrence: recurrenceSchema.optional(),
  reminders: z.array(reminderSchema).optional(),
};

export const createEventSchema = z
  .object(baseEventFields)
  .refine((value) => new Date(value.end_time).getTime() >= new Date(value.start_time).getTime(), {
    message: '終了時刻は開始時刻以降である必要があります',
    path: ['end_time'],
  });

export const updateEventSchema = z
  .object({
    ...baseEventFields,
    title: baseEventFields.title.optional(),
    start_time: baseEventFields.start_time.optional(),
    end_time: baseEventFields.end_time.optional(),
    recurrence: z.union([recurrenceSchema, z.null()]).optional(),
    reminders: z.array(reminderSchema).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: '少なくとも1項目を指定してください',
  })
  .refine(
    (value) => {
      if (!value.start_time || !value.end_time) return true;
      return new Date(value.end_time).getTime() >= new Date(value.start_time).getTime();
    },
    {
      message: '終了時刻は開始時刻以降である必要があります',
      path: ['end_time'],
    }
  );

export const reminderPresetsSchema = reminderSchema;
export const recurrenceInputSchema = recurrenceSchema;
