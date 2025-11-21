# Hybrid Agent System Verification Guide

This guide outlines the steps to verify the functionality of the Hybrid Multi-Layer Agent System (Phase 4).

## Prerequisites

1.  **Environment Setup**:
    *   Ensure you have the project running locally: `npm run dev`
    *   Access the application at `http://localhost:3000`

2.  **API Keys**:
    *   The system requires API keys for OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), and Google (Gemini 1.5 Pro).
    *   **Option A (Recommended for Dev)**: Set them in `.env.local` file in the project root.
        ```bash
        OPENAI_API_KEY=sk-...
        ANTHROPIC_API_KEY=sk-ant-...
        GOOGLE_GENERATIVE_AI_API_KEY=AIza...
        ```
    *   **Option B (Browser)**: If `.env.local` is not set, the system will look for keys in `localStorage`. You can set them via the browser console:
        ```javascript
        localStorage.setItem('OPENAI_API_KEY', 'sk-...');
        localStorage.setItem('ANTHROPIC_API_KEY', 'sk-ant-...');
        localStorage.setItem('GOOGLE_GENERATIVE_AI_API_KEY', 'AIza...');
        ```

## Verification Scenarios

### Scenario 1: Single Task Execution
**Goal**: Verify that the agent can handle a simple task using a single screen.

1.  **Prompt**: "新規プロジェクト「AI開発」を作成して"
2.  **Expected Behavior**:
    *   **Agent Overlay**: A screen (likely Left or Top-Left) shows "Thinking..." then "Executing...".
    *   **UI Action**: The "Projects" app opens.
    *   **Result**: A new project named "AI開発" appears in the list.
    *   **Check Agent**: The chat displays a confirmation message like "プロジェクト「AI開発」を作成しました。"

### Scenario 2: Parallel Task Execution
**Goal**: Verify that the agent can decompose a complex request and execute subtasks in parallel on multiple screens.

1.  **Prompt**: "プロジェクト「Webサイトリニューアル」を作成し、カレンダーに「キックオフミーティング」を明日10時に登録して"
2.  **Expected Behavior**:
    *   **Layout**: The screen splits into 2 (or more) panels.
    *   **Screen 1**: Opens "Projects" app, creates "Webサイトリニューアル".
    *   **Screen 2**: Opens "Calendar" app, creates an event "キックオフミーティング" for tomorrow 10:00.
    *   **Agent Overlay**: Both screens show progress independently.
    *   **Check Agent**: Reports success for both actions.

### Scenario 3: Sequential/Dependent Task Execution
**Goal**: Verify that the agent can handle tasks where one depends on another (though currently, the orchestrator defaults to parallel for independent tools, we can test multi-step logic).

1.  **Prompt**: "今月の売上を確認して、その結果を元に「売上報告」というプロジェクトを作成して"
2.  **Expected Behavior**:
    *   **Step 1**: Opens "Revenue" app to check sales.
    *   **Step 2**: Opens "Projects" app to create the project.
    *   **Note**: Depending on the planner's logic, this might happen sequentially or in parallel if the planner deems them independent enough. Ideally, it should check revenue first.

## Troubleshooting

*   **"Missing credentials" Error**:
    *   Check your `.env.local` file or `localStorage`.
    *   Ensure the keys are valid and have access to the required models (GPT-4o, Claude 3.5 Sonnet).

*   **Agent Stuck in "Thinking..."**:
    *   Check the browser console for network errors.
    *   Verify that the LLM API is responding.

*   **UI Not Updating**:
    *   Ensure the `AgentOverlay` is visible.
    *   Check if the `UIController` logs are appearing in the console.

## Running Automated Script

You can also run the CLI-based test script to verify the logic flow (without the actual UI).

```bash
npx tsx scripts/test-screen-agents.ts
```

This script simulates the orchestration process and prints the execution logs.
