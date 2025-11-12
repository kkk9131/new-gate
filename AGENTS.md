# AGENTS ガイドライン

このリポジトリで作業するエージェント向けの運用メモです。ユーザーから共有された暗黙知をここに集約し、以降のタスクをスムーズに進められるようにします。

## コミュニケーション
- ユーザーへの回答は原則 **日本語** で行い、丁寧で簡潔なトーンを心掛ける。
- レビューや PR 説明など文章量が多い場合は、適度に絵文字（例: ✨, ✅, 🪟）を織り交ぜると喜ばれる。
- ユーザーから英語出力を求められた場合のみ英語に切り替える。特に指定が無いときは常に日本語。

## 基本操作フロー
1. 依頼内容を確認したら `git status -sb` で差分状況を把握。
2. 依存追加後は `npm install` を忘れずに実行。
3. 実装やリファクタ後は必ず `npm run lint` を回して品質を確認する。
4. 変更内容を説明する際は、対象ファイルと行番号を引用しながら背景と意図をセットで伝える。

## コミットメッセージ基準
- 1 件のコミットで 1 つの論理変更をまとめる。
- メッセージは **日本語の短い要約 + 必要なら絵文字** を推奨。例: `Dock のホバー判定を修正 ✨`。
- 自動生成されたファイル（`package-lock.json` など）が含まれる場合も同じコミットにまとめてよいが、内容説明で触れること。

## PR 作成基準
- `phase3` など作業ブランチから `main` へ PR を作成する（`gh pr create --base main --head <branch>`）。
- **タイトル**: 日本語で概要を表し、最後に 1 つ程度の絵文字を添える。例: `デスクトップUIの操作改善 ✨`。
- **本文テンプレート**:
  ```md
  ## 概要
  - ✨ 変更点1
  - 🛠️ 変更点2

  ## 確認項目
  - [x] npm run lint
  ```
- 追加の検証（e2e テストなど）を行った場合は「確認項目」に追記。

## その他
- `.yoyo/` などローカル専用ディレクトリは `.gitignore` で無視されているので触らない。
- `.vscode/` に開発者向け設定が追加されることがあるが、ユーザーから要望が無い限りコミット対象にしない。
- 既存のガイド（CLAUDE.md など）があれば併読し、矛盾する場合はユーザーへ確認する。
- Python スクリプトを直接書くのではなく、CLI で提供される `tools`（shell コマンド等）を優先的に使用する。


# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Memory
Project memory keeps persistent guidance (steering, specs notes, component docs) so Codex honors your standards each run. Treat it as the long-lived source of truth for patterns, conventions, and decisions.

- Use `.kiro/steering/` for project-wide policies: architecture principles, naming schemes, security constraints, tech stack decisions, api standards, etc.
- Use local `AGENTS.md` files for feature or library context (e.g. `src/lib/payments/AGENTS.md`): describe domain assumptions, API contracts, or testing conventions specific to that folder. Codex auto-loads these when working in the matching path.
- Specs notes stay with each spec (under `.kiro/specs/`) to guide specification-level workflows.

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/prompts:kiro-spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, but generate responses in Japanese (思考は英語、回答の生成は日本語で行うように)

## Minimal Workflow
- Phase 0 (optional): `/prompts:kiro-steering`, `/prompts:kiro-steering-custom`
- Phase 1 (Specification):
  - `/prompts:kiro-spec-init "description"`
  - `/prompts:kiro-spec-requirements {feature}`
  - `/prompts:kiro-validate-gap {feature}` (optional: for existing codebase)
  - `/prompts:kiro-spec-design {feature} [-y]`
  - `/prompts:kiro-validate-design {feature}` (optional: design review)
  - `/prompts:kiro-spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/prompts:kiro-spec-impl {feature} [tasks]`
  - `/prompts:kiro-validate-impl {feature}` (optional: after implementation)
- Progress check: `/prompts:kiro-spec-status {feature}` (use anytime)

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/prompts:kiro-spec-status`

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/prompts:kiro-steering-custom`)
