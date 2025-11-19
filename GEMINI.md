# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

---

## Project Overview

This project is a multi-tasking SaaS application named "new-gate", envisioned as a plugin-based platform. It provides a desktop-like user interface within the browser, allowing users to manage various tasks and applications in a windowed environment, complemented by a fixed chat sidebar on the right.

### Architectural Concept

```
┌─────────────────────────────────────────────────┬─────┐
│  Desktop Area (App Icon Grid)                   │Chat │
│                                                 │     │
│   [📁]    [⚙️]    [💰]    [🏪]    [🤖]         │[💬] │
│  Projects Settings Revenue  Store  Agent        │     │
│                                                 │Fixed│
│  ┌──────────────────┐                          │View │
│  │ Window: Projects │ ← Windows are freely     │     │
│  │ [_][□][×]       │    positionable          │     │
│  ├──────────────────┤                          │Always│
│  │ Content...       │                          │Chat │
│  └──────────────────┘                          │Available│
└─────────────────────────────────────────────────┴─────┘
```

### 3-Layer Architecture

The platform is designed with a 3-layer architecture for scalability and extensibility:

#### 1. **MVP Layer (Phase 1-8)**
- Desktop OS-like UI + fixed right-side chat.
- Default applications: Projects, Settings, Revenue.
- All operations are performed via API calls initiated through the chat interface.

#### 2. **Plugin System (Phase 9-10)**
- Features a plugin store (search, install, review).
- Provides a plugin execution environment (sandbox, permission management).
- Includes an SDK and CLI for developers.

#### 3. **Agent System (Phase 11)**
- YAML workflow definitions for automation.
- Task scheduler (with cron support).
- Background execution engine.

The main technologies used are:
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (PostgreSQL and Authentication)
- **State Management:** Zustand
- **UI:** The UI is designed to resemble a desktop operating system, with features like a dock, draggable windows, and application icons.

The application includes the following core features:
- **Project Management:** Create, Read, Update, and Delete projects.
- **Settings Management:** User and application settings.
- **Revenue Tracking:** Register and aggregate sales data.
- **Chat UI:** An interactive interface powered by OpenAI ChatKit.

The application has a modular design, with different functionalities encapsulated within "apps" that can be opened and managed within the desktop environment. The default apps include:
- Projects
- Settings
- Revenue
- Store
- Agent
- Dashboard
- Analytics
- Calendar

---

## Architecture

### State Management Strategy

**Zustand-based Multi-Store Pattern**:

```typescript
// Desktop UI state management
store/useDesktopStore.ts
  - openWindows: Manages open windows
  - openApp(appId): Launches an application
  - closeWindow(windowId): Closes a window

// Plugin state management
store/usePluginStore.ts
  - installedPlugins: Installed plugins
  - activePlugins: Active plugins
  - loadPlugin(pluginId): Loads a plugin

// Chat state management
store/useChatStore.ts
  - messages: Message history
  - sendMessage(content): Sends a message
```

### UI Configuration

#### Desktop Area (Left Side)
- **Header**: Logo, open window tabs, 4-split mode toggle, user menu.
- **Desktop Area**: App icon grid (8 columns x N rows).
- **Windows**: Freely movable and resizable windows (max 3-4).

#### Chat Sidebar (Right Side)
- **Fixed Width**: 320px (w-80).
- **Always Visible**: No page transitions.
- **Features**:
  - Instruct app launch ("Open project management").
  - Instruct data operations ("Create a new project").
  - Execute agent tasks ("Generate monthly report").
  - Manage plugins ("Install sales plugin").

---

## Development Commands

### Core Development Workflow
```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

### TypeScript Configuration
- Path alias: `@/*` maps to project root
- Strict mode enabled
- Target: ES2017
- JSX: react-jsx (React 19)

---

## Key Files & Structure

```
new-gate/
├── app/
│   ├── layout.tsx                 # Root layout (Japanese locale setting)
│   ├── page.tsx                   # Desktop UI + Chat
│   ├── globals.css                # Tailwind CSS
│   └── api/
│       ├── projects/              # Project management API
│       ├── settings/              # Settings API
│       ├── revenues/              # Revenue API
│       ├── store/                 # Plugin store API
│       ├── plugins/               # Plugin management API
│       └── agent/                 # Agent API
│
├── components/
│   ├── desktop/
│   │   ├── DesktopArea.tsx       # Desktop area
│   │   ├── AppIcon.tsx           # App icon
│   │   └── Window.tsx            # Window component
│   ├── chat/
│   │   └── ChatSidebar.tsx       # Fixed right-side chat
│   ├── plugins/
│   │   ├── PluginLoader.tsx      # Plugin loader
│   │   └── StoreApp.tsx          # Store app UI
│   └── agent/
│       └── AgentApp.tsx          # Agent app UI
│
├── store/
│   ├── useDesktopStore.ts        # Desktop UI state management
│   ├── usePluginStore.ts         # Plugin state management
│   └── useChatStore.ts           # Chat state management
│
├── lib/
│   ├── plugins/
│   │   ├── loader.ts             # Plugin loader
│   │   ├── sandbox.ts            # Sandbox execution
│   │   └── permissions.ts        # Permission management
│   └── agent/
│       ├── workflow-engine.ts    # Workflow engine
│       └── scheduler.ts          # Task scheduler
│
└── docs/
    ├── platform-requirements.md   # Platform-wide requirements
    ├── plugin-architecture.md     # Plugin system design
    ├── desktop-ui-design.md      # Desktop UI design
    ├── plugin-store-design.md     # Store design
    ├── developer-guide.md         # Plugin developer guide
    ├── core-api-spec.md          # Core API specification
    ├── agent-system-design.md     # Agent system design
    ├── chatkit-implementation.md # ChatKit implementation guide
    ├── mvp-requirements.md       # MVP requirements
    ├── database-schema.md        # Database definitions, RLS settings
    ├── api-design.md             # API design document
    ├── setup-guide.md            # Setup guide
    └── tasks.md                  # Implementation task list

---

## Development Guidelines

### Implementation Priority

#### Phase 1-8: MVP Implementation
1.  **Environment Setup**
    -   Supabase, OpenAI, Vercel configuration.
    -   Database table creation.
    -   Environment variable setup.

2.  **Authentication System**
    -   Supabase Auth integration.
    -   Login/logout functionality.

3.  **Desktop UI**
    -   Header, DesktopArea, Window implementation.
    -   App icon grid placement.
    -   Window management (open, close, move, resize).

4.  **Chat UI**
    -   ChatKit fixed right-side layout.
    -   Agent Builder configuration.
    -   Custom action integration.

5.  **MVP App Implementation**
    -   Projects: CRUD + API.
    -   Settings: User and application settings.
    -   Revenue: Revenue data management and aggregation.

#### Phase 9-10: Plugin System
6.  **Plugin Infrastructure**
    -   Store API implementation.
    -   Plugin loader.
    -   Sandbox execution environment.

7.  **Developer Tools**
    -   SDK development (Core API implementation).
    -   CLI development (plugin generation/deployment).
    -   Developer dashboard.

#### Phase 11: Agent System
8.  **Agent Implementation**
    -   Workflow engine.
    -   Task scheduler.
    -   Agent UI.

### Guidelines for Adding Features

#### 1. Consider Plugin Compatibility
-   For all new features, consider whether they can be implemented as plugins.
-   MVP applications should also be designed to be plugin-ready.

#### 2. Implement via Core API
-   Avoid direct DOM manipulation.
-   Implement via `context.ui`, `context.storage`, `context.http`.

#### 3. Chat Integration
-   All features should be operable via the chat interface.
-   Register custom functions with Agent Builder.

#### 4. Permission Management
-   Implement appropriate permission checks for all new API calls.
-   Utilize RLS (Row Level Security).

### Git Operations Guidelines

#### ⚠️ Important: Git operations must always await explicit user instructions.

**Prohibited Actions**:
- ❌ **Direct operations on `main` branch**: `push`, `merge`, `rebase`, etc., are strictly prohibited.
- ❌ **Direct commit/push to `dev` branch**: Always work via feature branches.
- ❌ **Unauthorized merges**: Do not merge without explicit user instructions.
- ❌ **Unauthorized pushes**: After committing, always confirm with the user before pushing.

**Workflow**:
1.  **New Feature Development**: Always work on a feature branch (worktree).
    -   Example: `feature/calendar-app`, `feature/revenue-app`
2.  **Commit**: Commit on the feature branch.
3.  **Push Confirmation**: Ask the user, "Should I push these changes?"
4.  **Merge Confirmation**: Ask the user, "Should I merge this to `dev`?"

**Exception**: Commits and pushes to feature branches can be executed freely, but confirmation is recommended.

#### Working with Git Worktrees

**Worktree Structure**:
```
/Users/kazuto/Desktop/new-gate            # dev branch (main)
/Users/kazuto/Desktop/new-gate-calendar   # feature/calendar-app
/Users/kazuto/Desktop/new-gate-revenue    # feature/revenue-app
/Users/kazuto/Desktop/new-gate-settings   # feature/notification-system
```

**⚠️ Important: Execute Bash commands in the worktree directory.**

Since the Bash tool automatically returns to the original directory (`/Users/kazuto/Desktop/new-gate`) after execution, **always prepend `cd` to your commands**:

```bash
# ❌ Incorrect (will execute on dev branch)
git add -A

# ✅ Correct (will execute on feature/calendar-app)
cd /Users/kazuto/Desktop/new-gate-calendar && git add -A
cd /Users/kazuto/Desktop/new-gate-calendar && git commit -m "..."
cd /Users/kazuto/Desktop/new-gate-calendar && git push origin feature/calendar-app
```

**Worktree Workflow**:
1.  **Branch Check**: `cd /path/to/worktree && git branch --show-current`
2.  **File Editing**: Read/Edit/Write as usual using absolute paths.
3.  **Git Operations**: Always prepend `cd /path/to/worktree &&`.

**Checking Worktree List**:
```bash
git worktree list
```

### Commit Messages

-   Commit messages should be written in **Japanese**.
-   The message should clearly and specifically describe what was done.
-   Appropriate emojis should be used to visually clarify the commit content.

**Example Commit Messages**:
```bash
# ✅ Good Examples
git commit -m "✨ プラグインローダー機能を追加しました"
git commit -m "🐛 チャットUIのレイアウト崩れを修正しました"
git commit -m "♻️ Core API実装をリファクタリングしました"
git commit -m "📝 プラグイン開発ガイドを更新しました"
git commit -m "🎨 デスクトップUIのアイコン配置を改善しました"

# ❌ Bad Examples
git commit -m "Update code"  # Avoid English
git commit -m "修正"  # Unclear what was fixed
git commit -m "機能追加"  # Lacks specificity
```

**Common Emojis and Their Meanings**:
- ✨ 新機能追加
- 🐛 バグ修正
- 📝 ドキュメント更新
- 🎨 UI/スタイル改善
- ♻️ リファクタリング
- ⚡ パフォーマンス改善
- 🔧 設定ファイル変更
- ✅ テスト追加/更新
- 🚀 デプロイ関連
- 🔒 セキュリティ関連
- 🔌 プラグイン関連
- 🤖 エージェント関連

**Example Git Operations**:
```bash
# OK: Working on a feature branch
git checkout -b feature/plugin-loader
git add .
git commit -m "✨ プラグインローダーを実装しました"
git push origin feature/plugin-loader

# ⚠️ Confirmation required: Merge to main
# Before executing, confirm with the user: "mainブランチにマージしてもよろしいですか？変更内容: プラグインローダーの追加"
git checkout main
git merge feature/plugin-loader
git push origin main
```

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router, TypeScript)
- **React 19** (latest)
- **ChatKit** (@openai/chatkit-react) - Fixed right-side chat UI
- **Zustand** (state management)
- **Tailwind CSS** (styling)
- **TypeScript 5.9** (strict mode)

### Backend
- **Next.js API Routes** - RESTful API (32 endpoints)
- **Next.js Server Actions** - Server-side logic
- **Supabase** - PostgreSQL database & authentication (11 tables)
- **Supabase Client** - Database connection

### Development Tools
- **Vercel** - Hosting & deployment
- **GitHub** - Version control
- **ESLint** - Linting
- **Prettier** - Code formatting

---

## Documentation

### Platform Design Documents
Full design specifications can be found here:

#### Basic Design (Must-Read)
-   **[Platform Requirements](./docs/platform-requirements.md)** - Overall concept, vision
-   **[Plugin Architecture](./docs/plugin-architecture.md)** - Plugin system design
-   **[Desktop UI Design](./docs/desktop-ui-design.md)** - UI specifications, layout

#### Plugin Development (When implementing plugins)
-   **[Developer Guide](./docs/developer-guide.md)** - SDK/CLI usage
-   **[Core API Specification](./docs/core-api-spec.md)** - List of available APIs
-   **[Plugin Store Design](./docs/plugin-store-design.md)** - Store specifications

#### Agent (When implementing automation)
-   **[Agent System Design](./docs/agent-system-design.md)** - Workflow, scheduler

#### Implementation Guide
-   **[Setup Guide](./docs/setup-guide.md)** - Development environment setup procedure
-   **[ChatKit Implementation Guide](./docs/chatkit-implementation.md)** - Chat integration method
-   **[MVP Requirements](./docs/mvp-requirements.md)** - MVP feature requirements
-   **[Database Schema](./docs/database-schema.md)** - Table definitions, RLS settings
-   **[API Design Document](./docs/api-design.md)** - Endpoint specifications
-   **[Implementation Task List](./docs/tasks.md)** - Detailed tasks for Phases 1-11

### Workflow for Starting Implementation

#### Step 1: Understand Documents
```bash
# 1. Understand the overall platform
# Read docs/platform-requirements.md

# 2. Confirm specifications for the assigned phase
# Check implementation phase in docs/tasks.md

# 3. Read relevant design documents
# docs/plugin-architecture.md      # When implementing plugins
# docs/agent-system-design.md      # When implementing agents
# docs/desktop-ui-design.md        # When implementing UI
```

#### Step 2: Confirm Technical Specifications
```bash
# Database Structure
docs/database-schema.md

# API Specifications
docs/api-design.md

# Core API (When developing plugins)
docs/core-api-spec.md
```

#### Step 3: Start Implementation
```bash
# Implement according to the task list
# Check the checklist in docs/tasks.md

# If setup is required
# Execute docs/setup-guide.md
```

---

## Development Best Practices

### Coding Conventions

#### TypeScript
-   **Type Definitions**: Explicitly define types for all functions.
-   **Null Safety**: Use `?.` optional chaining.
-   **Type Inference**: Prioritize explicit type annotations.

#### React
-   **Functional Components**: All components are functional.
-   **Hooks**: Utilize useState, useEffect, and custom Hooks.
-   **Props Type Definitions**: Explicitly define types using interfaces.

#### API Design
-   **RESTful**: Use GET, POST, PATCH, DELETE appropriately.
-   **Error Handling**: Unified error response format.
-   **Authentication**: Use Bearer token.

### Security

#### Environment Variable Management
```env
# ❌ Client-exposed (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# ✅ Server-side only
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=xxx
```

#### RLS (Row Level Security)
-   Enable RLS for all Supabase tables.
-   Separate data per user.
-   Control permissions per plugin.

#### Plugin Sandbox
-   Prohibit direct DOM manipulation.
-   Allow operations only via Core API.
-   Implement permission checks.

---

## Troubleshooting

### Common Issues and Solutions

#### ChatKit Not Displaying
```bash
# 1. Check Domain Allowlist
# OpenAI Dashboard → ChatKit → Domain Allowlist
# Add localhost:3000

# 2. Check Workflow ID
# Confirm that CHATKIT_WORKFLOW_ID in .env.local is correct.

# 3. Check Organization Authentication
# Confirm that your OpenAI organization is authenticated for streaming.
```

#### Supabase Connection Error
```bash
# 1. Check Environment Variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Check RLS Settings
# Supabase Dashboard → Authentication → RLS Policies

# 3. Connection Test
# Check browser console with npm run dev.
```

#### Plugin Not Loading
```bash
# 1. Validate plugin.json
# Confirm that plugin.json syntax is correct.

# 2. Check Permissions
# Confirm that required permissions are included in the permissions array.

# 3. Check Entry Point
# Confirm that the file specified in 'entry' exists.
```

---

## Notes

### Important Design Decisions
-   **Chat-Centric**: All operations can be executed via chat.
-   **Plugin-Oriented**: MVP apps are designed to be re-implementable as plugins.
-   **API-Driven**: UI operates exclusively via API, avoiding direct data manipulation.
-   **Extensibility First**: Design prioritizes future feature additions.

### Limitations
-   Desktop screen only (mobile not supported).
-   Maximum number of concurrently open windows: 3-4.
-   Plugin Sandbox: Direct DOM manipulation is not allowed.

---

## Communication Guidelines for Gemini

### Core Principles
-   **Accuracy First**: If information is unknown, state "unknown" rather than speculating. Provide only verified information.
-   **Clarity**: Explain technical concepts clearly and concisely. Avoid jargon where simpler language suffices.
-   **Proactive Questions**: Always ask for clarification if a request is ambiguous or lacks necessary details.
-   **Transparency**: Clearly communicate any technical limitations or implementation challenges.
-   **Task Focus**: Adhere strictly to the task requirements and project documentation.

### Output Language
**All outputs must be in Japanese.**
-   Code explanations, error messages, suggestions, and progress reports should be in Japanese.
-   All communication with the user should be in Japanese.

### Code Comments
**Always include clear, understandable Japanese comments in the code, especially for complex logic.**
-   Explain the intent of complex logic in Japanese.
-   Use JSDoc/Docstring format for functions and classes, including Japanese descriptions.
-   Even if variable names are in English, explain their purpose in Japanese comments.

**Example Comment**:
```typescript
// ユーザーの認証状態を確認する関数
// 引数: token - JWTトークン文字列
// 戻り値: 認証が成功した場合はユーザー情報、失敗した場合はnull
async function verifyUser(token: string): Promise<User | null> {
  // トークンの有効性をチェック
  const isValid = await validateToken(token);

  if (!isValid) {
    // トークンが無効な場合はnullを返す
    return null;
  }

  // データベースからユーザー情報を取得
  const user = await fetchUserFromDB(token);
  return user;
}
```

### Git Operations
-   **Git operations on the `main` branch (push, merge, rebase, etc.) must always be confirmed by the user.**
-   Directly modifying the `main` branch without confirmation is prohibited.
-   Creating branches and committing to feature branches can be performed freely.
-   Before merging to `main`, always confirm with the user: "mainブランチにマージしてもよろしいですか？"

### Commit Messages
-   Commit messages should be written in **Japanese**.
-   The message should clearly and specifically describe what was done.
-   Use appropriate emojis to visually clarify the commit content.

**Example Commit Messages**:
```bash
# ✅ Good Examples
git commit -m "✨ プラグインローダー機能を追加しました"
git commit -m "🐛 チャットUIのレイアウト崩れを修正しました"
git commit -m "♻️ Core API実装をリファクタリングしました"
git commit -m "📝 プラグイン開発ガイドを更新しました"
git commit -m "🎨 デスクトップUIのアイコン配置を改善しました"

# ❌ Bad Examples
git commit -m "Update code"  # Avoid English
git commit -m "修正"  # Unclear what was fixed
git commit -m "機能追加"  # Lacks specificity
```

**Common Emojis and Their Meanings**:
- ✨ 新機能追加
- 🐛 バグ修正
- 📝 ドキュメント更新
- 🎨 UI/スタイル改善
- ♻️ リファクタリング
- ⚡ パフォーマンス改善
- 🔧 設定ファイル変更
- ✅ テスト追加/更新
- 🚀 デプロイ関連
- 🔒 セキュリティ関連
- 🔌 プラグイン関連
- 🤖 エージェント関連

**Example Git Operations**:
```bash
# OK: Working on a feature branch
git checkout -b feature/plugin-loader
git add .
git commit -m "✨ プラグインローダーを実装しました"
git push origin feature/plugin-loader

# ⚠️ Confirmation required: Merge to main
# Before executing, confirm with the user: "mainブランチにマージしてもよろしいですか？変更内容: プラグインローダーの追加"
git checkout main
git merge feature/plugin-loader
git push origin main
```