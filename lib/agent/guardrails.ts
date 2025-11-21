import { z } from 'zod';

const FinalReportSchema = z.object({
  success: z.boolean(),
  report: z.string(),
  issues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([])
});

/**
 * Runner実行結果をガードレールで検証。
 * - JSON文字列ならスキーマで検証
 * - 不正な場合はサニタイズして文字列化
 */
export function guardrailFinalOutput(output: any): string {
  if (typeof output === 'string') {
    // JSONならパースを試みる
    const trimmed = output.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const safe = FinalReportSchema.parse(parsed);
        return formatReport(safe);
      } catch {
        return output;
      }
    }
    return output;
  }

  try {
    const safe = FinalReportSchema.parse(output);
    return formatReport(safe);
  } catch {
    return `タスクが完了しました。\n\n${JSON.stringify(output, null, 2)}`;
  }
}

function formatReport(data: z.infer<typeof FinalReportSchema>): string {
  let report = `タスクが完了しました。\n\n【実行結果】\n${data.report}\n\n`;
  if (!data.success && data.issues.length > 0) {
    report += `⚠️ 問題:\n${data.issues.map((i) => `- ${i}`).join('\n')}\n\n`;
  }
  if (data.suggestions.length > 0) {
    report += `💡 改善提案:\n${data.suggestions.map((s) => `- ${s}`).join('\n')}`;
  }
  return report;
}
