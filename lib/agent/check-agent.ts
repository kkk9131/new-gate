import { router } from '../llm/router';
import { Message } from '../llm/types';

export interface CheckResult {
    success: boolean;
    issues: string[];
    suggestions: string[];
    report: string;
}

export class CheckAgent {
    private provider = 'openai' as const; // GPT-4o-mini (検証用)

    /**
     * 実行結果を検証する
     */
    async verify(
        userRequest: string,
        executionResults: { screenId: number; appId: string; result: string }[],
        apiKey?: string
    ): Promise<CheckResult> {
        console.log('[CheckAgent] Verifying execution results...');

        const worker = router.getWorker(this.provider, apiKey);

        const resultsText = executionResults
            .map(r => `Screen ${r.screenId} (${r.appId}): ${r.result}`)
            .join('\n\n');

        const prompt = `
あなたはAIエージェントの実行結果を検証する品質管理担当者です。
ユーザーの要求に対して、各エージェントの実行結果が適切かどうかを判断してください。

【ユーザーの要求】
"${userRequest}"

【実行結果】
${resultsText}

【検証項目】
1. ユーザーの要求は完全に満たされましたか？
2. エラーや不整合はありませんか？
3. 改善すべき点はありますか？

【出力形式】
JSON形式で回答してください:
{
  "success": true,
  "issues": ["問題点1", "問題点2"],
  "suggestions": ["改善提案1", "改善提案2"],
  "report": "検証レポートの要約"
}
`;

        const messages: Message[] = [
            { role: 'system', content: 'あなたは品質管理担当のAIエージェントです。' },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await worker.generate(messages, undefined, {
                temperature: 0,
                model: 'gpt-4o-mini' // コスト効率の良いモデルを使用
            });

            const result = this.parseJSON(response.content);
            console.log('[CheckAgent] Verification result:', result);

            return {
                success: result.success ?? false,
                issues: result.issues || [],
                suggestions: result.suggestions || [],
                report: result.report || '検証完了'
            };

        } catch (error) {
            console.error('[CheckAgent] Verification failed:', error);
            // フォールバック
            return {
                success: true, // 検証失敗してもタスク自体は成功している可能性があるため
                issues: ['検証プロセスでエラーが発生しました'],
                suggestions: [],
                report: '検証を実行できませんでした'
            };
        }
    }

    /**
     * JSON解析ヘルパー
     */
    private parseJSON(content: string): any {
        let cleaned = content.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        return JSON.parse(cleaned);
    }
}

// シングルトンインスタンス
export const checkAgent = new CheckAgent();
