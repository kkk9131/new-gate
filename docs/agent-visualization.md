# エージェント可視化の手順（Agents SDK / Python）

OpenAI Agents SDK の可視化拡張を使い、Router → ScreenSubAgent → CheckAgent の関係をグラフとして出力するための手順です。

## 1. 依存インストール
```bash
pip install "openai-agents[viz]"
# Graphviz 本体が未インストールなら
brew install graphviz   # macOS の例
```

## 2. スクリプト実行
```bash
python scripts/visualize_agents.py
```

`scripts/agent_graph.png` が生成されます。`format` を変えたい場合はスクリプト内 `draw_graph(..., format="png")` を `svg` や `pdf` に変更してください。

本スクリプトは「Triage Agent → (Technical Support / Sales / Order Management)」の分散型パターンを定義しています。`triage_agent` をルートに `draw_graph` しているので、スクリーンショット例と同様の構造が描画されます。

## 3. カスタマイズのヒント
- エージェント構成を変えたいときは `scripts/visualize_agents.py` の Agent/Handoff/Tools を書き換えるだけで再出力できます。
- 実運用の構成を反映する場合は、Router に handoffs として複数の ScreenSubAgent や App 専用 Agent を追加してください。
- OpenAI Traces を併用すると、静的構造（本ドキュメント）＋実行ログ（トレース）の両面で追跡できます。
