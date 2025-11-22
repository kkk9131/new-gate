import {
    Agent,
    Runner,
    handoff,
    tool,
    type RunContext,
    OpenAIConversationsSession,
    type Session
} from '@openai/agents';
import { AgentAction } from './server/types';
import { guardrailFinalOutput } from './guardrails';
import { StreamedRunResult } from '@openai/agents-core';
import { loadTools } from './tool-loader';
import { ToolDefinition } from '../llm/types';
import { executeTool } from './tool-executor';

type AgentRunContext = {
    dispatch?: (action: AgentAction) => void;
    apiKeys?: Record<string, string>;
    userId?: string;
};

// Runner インスタンス（シングルトン）
const runner = new Runner<AgentRunContext>({ model: 'gpt-5-nano' });

// コンテキスト保持を Conversations API に預けると一部アイテム型で 400 を返すため、
// 現状デフォルト無効化。必要になったら true に変更し再テスト。
const USE_CONVERSATION_SESSIONS = false;

// セッション管理（userId や任意の sessionKey で会話履歴を保持）
const sessionStore = new Map<string, Session<AgentRunContext>>();

function getSession(sessionKey?: string, userId?: string): Session<AgentRunContext> {
    const key = sessionKey || userId || 'anonymous';
    if (sessionStore.has(key)) return sessionStore.get(key)!;

    const maybeConversationId = sessionKey?.startsWith('conv') ? sessionKey : undefined;
    const session = new OpenAIConversationsSession<AgentRunContext>({
        conversationId: maybeConversationId
    });
    sessionStore.set(key, session);
    return session;
}

async function prepareSession(sessionKey?: string, userId?: string) {
    if (!USE_CONVERSATION_SESSIONS) return { session: undefined, resolvedSessionId: undefined as string | undefined };
    const session = getSession(sessionKey, userId);
    const resolvedSessionId = await session.getSessionId();
    return { session, resolvedSessionId };
}

/**
 * OpenAI の関数ツール仕様に沿うよう、parameters に必須フィールドを自動補正する。
 * - required が無ければ properties の全キーを required にする
 * - additionalProperties を明示的に false にする
 */
function normalizeParameters(params: any): any {
    if (!params || typeof params !== 'object') return params;
    const properties = params.properties || {};
    // OpenAI Responses API 要件: required は properties の全キーを含める必要がある
    const required = Array.isArray(params.required) && params.required.length === Object.keys(properties).length
        ? params.required
        : Object.keys(properties);
    return {
        ...params,
        properties,
        required,
        additionalProperties: false
    };
}

/**
 * ToolDefinition を Agents SDK の function ツールに変換
 */
function toFunctionTool(def: ToolDefinition, appId: string) {
    return tool({
        name: def.name,
        description: def.description,
        parameters: normalizeParameters(def.parameters),
        async execute(args: any, runContext?: RunContext<AgentRunContext>) {
            const ctx = runContext?.context;
            const dispatch = ctx?.dispatch;
            const userId = ctx?.userId;

            // UI系ツールは dispatch で処理
            if (def.name === 'ui_open_app') {
                if (!dispatch) throw new Error('dispatch is not available');
                const { appId: targetApp } = args || {};
                const screenId = 1;
                dispatch({ type: 'SET_LAYOUT', payload: { layout: 1 } });
                dispatch({ type: 'OPEN_APP', payload: { screenId: Number(screenId) || 1, appId: targetApp || appId } });
                dispatch({ type: 'UPDATE_STATUS', payload: { screenId: Number(screenId) || 1, status: 'executing', progress: 10 } });
                return { success: true, message: 'opened app' };
            }
            if (def.name === 'ui_set_layout') {
                if (!dispatch) throw new Error('dispatch is not available');
                const { layout = 1 } = args || {};
                dispatch({ type: 'SET_LAYOUT', payload: { layout } });
                return { success: true, message: 'layout set' };
            }

            if (!userId) throw new Error('User ID is required for tool execution');
            return executeTool(def.name, args, userId, appId);
        }
    });
}

// UI制御用の追加ツール
const uiTools: ToolDefinition[] = [
    {
        name: 'ui_open_app',
        description: '指定スクリーンにアプリを開く',
        parameters: {
            type: 'object',
            properties: {
                appId: { type: 'string', description: '開くアプリID' },
                screenId: { type: 'number', description: 'スクリーン番号(1-4)', default: 1 }
            },
            required: ['appId', 'screenId'],
            additionalProperties: false
        }
    },
    {
        name: 'ui_set_layout',
        description: 'スクリーンレイアウトを設定する',
        parameters: {
            type: 'object',
            properties: {
                layout: { type: 'number', enum: [1, 2, 3, 4], description: 'レイアウト数', default: 1 }
            },
            required: ['layout'],
            additionalProperties: false
        }
    }
];

/**
 * アプリ別エージェントを動的に組み立てる
 */
async function buildAppAgents(appIds: string[], userId?: string, dispatch?: (action: AgentAction) => void): Promise<Agent<AgentRunContext>[]> {
    const agents: Agent<AgentRunContext>[] = [];
    for (const appId of appIds) {
        const tools = [...uiTools, ...(await loadTools({ appId, userId, includeSamples: true }))];
        const functionTools = tools.map((t) => toFunctionTool(t, appId));
        const instructionsLines = [
            `あなたは ${appId} アプリに特化したエージェントです。`,
            '与えられた指示を、このアプリ内のツールのみを使って完結させてください。',
            '最初に ui_set_layout(1) と ui_open_app(appId, screenId=1) を呼んで画面を準備してください。',
            '必須入力が足りない場合は「仮値を入れて実行」もしくは「不足項目を質問」のどちらかを取り、必ず理由を書く。',
            '自分だけで回答せず、最低1回はツールを実行し、その結果に基づいて返答する。',
            '出力は日本語で簡潔に。手順と結果を1行ずつ列挙。'
        ];
        if (appId === 'projects') {
            instructionsLines.push('プロジェクト作成依頼では create_project を必ず実行し、title が無い場合は依頼文から推定して設定する。');
        }
        const instructions = instructionsLines.join('\n');

        agents.push(new Agent<AgentRunContext>({
            name: `${appId}-agent`,
            instructions,
            tools: functionTools,
            model: 'gpt-5-nano',
            modelSettings: { toolChoice: 'required' },
            toolUseBehavior: appId === 'projects'
                ? { stopAtToolNames: ['create_project'] }
                : 'run_llm_again'
        }));
    }
    return agents;
}

/**
 * ルート（Triage）エージェントを生成
 */
async function buildTriageAgent(appIds: string[], userId?: string, dispatch?: (action: AgentAction) => void): Promise<Agent<AgentRunContext>> {
    const appAgents = await buildAppAgents(appIds, userId, dispatch);
    return new Agent<AgentRunContext>({
        name: 'Triage',
        instructions: [
            'あなたは司令塔です。ユーザーの依頼を解析し、最適な専門エージェントに handoff してください。',
            '自分でツールを使わず、必ず handoff を一度だけ選びます。',
            'handoff 先には必要なコンテキスト（推定タスク、補足情報、優先度）を短く渡してください。',
            '返答は日本語で簡潔に。重複した文言は避ける。'
        ].join('\n'),
        handoffs: appAgents.map((a) => handoff(a)),
        model: 'gpt-5-nano'
    });
}

export async function runWithAgentsSDK(
    userRequest: string,
    apiKeys: Record<string, string>,
    dispatch: (action: AgentAction) => void,
    userId?: string,
    sessionId?: string
): Promise<string> {
    const triageAgent = await buildTriageAgent(['projects', 'calendar', 'revenue', 'settings', 'store'], userId, dispatch);
    const { session } = await prepareSession(sessionId, userId);
    const result = await runner.run(triageAgent, userRequest, {
        context: { dispatch, apiKeys, userId },
        session
    });

    const raw = typeof result.output === 'string'
        ? result.output
        : JSON.stringify(result.output, null, 2);

    return guardrailFinalOutput(raw);
}

/**
 * ストリーミング版実行
 */
export async function runWithAgentsSDKStream(
    userRequest: string,
    apiKeys: Record<string, string>,
    dispatch: (action: AgentAction) => void,
    userId?: string,
    sessionId?: string
): Promise<StreamedRunResult<AgentRunContext, Agent<AgentRunContext>>> {
    const triageAgent = await buildTriageAgent(['projects', 'calendar', 'revenue', 'settings', 'store'], userId, dispatch);
    const { session } = await prepareSession(sessionId, userId);
    return runner.run(triageAgent, userRequest, {
        stream: true,
        context: { dispatch, apiKeys, userId },
        session
    });
}

export { runner as agentsRunner };
export { prepareSession };
