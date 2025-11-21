import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { runWithAgentsSDK } from '../lib/agent/agents-runner';
import { AgentAction } from '../lib/agent/server/types';
import { loadTools, SAMPLE_PLUGIN_TOOLS } from '../lib/agent/tool-loader';

const apiKeys = {
  openai: process.env.OPENAI_API_KEY || '',
  claude: process.env.ANTHROPIC_API_KEY || '',
  gemini: process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
};

const dispatch = (action: AgentAction) => {
  console.log(`[Dispatch] ${action.type}`, JSON.stringify(action.payload));
};

async function runScenario(name: string, prompt: string) {
  console.log(`\n=== ${name} ===`);
  const result = await runWithAgentsSDK(prompt, apiKeys, dispatch);
  console.log(result);
}

async function checkPluginTools() {
  const tools = await loadTools({ includeSamples: true });
  const hasSample = tools.some((t) => t.name === SAMPLE_PLUGIN_TOOLS[0].name);
  console.log('\n[Plugin Tools] sample presence:', hasSample);
}

async function main() {
  if (!apiKeys.openai) {
    console.warn('⚠️ OPENAI_API_KEY missing. Runner may fail.');
  }

  await runScenario('Parallel (Projects + Calendar)', 'プロジェクト「新店舗開店」を作って、カレンダーに「内覧会」を来週火曜10時で登録して');
  await runScenario('Sequential (Revenue then Project)', '今月の売上を確認して、その結果を踏まえて「月次レポート」をプロジェクトに追加して');
  await runScenario('Plugin Tool (Sample)', 'サンプルプラグインのTODOに「牛乳を買う」を追加して');
  await checkPluginTools();
}

main().catch((e) => {
  console.error('Test failed', e);
});
