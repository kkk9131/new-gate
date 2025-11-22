"""
Agents SDK 可視化サンプルスクリプト

前提:
  pip install "openai-agents[viz]"
  Graphviz が未インストールなら OS パッケージで追加（例: brew install graphviz）

実行:
  python scripts/visualize_agents.py
生成物:
  agent_graph.png （同ディレクトリに出力）
"""

from agents import Agent, Runner, function_tool
from agents.extensions.visualization import draw_graph


# --- Tools (ダミー定義: UI 操作用の例) ---
@function_tool
def ui_set_layout(mode: str) -> str:
    """スクリーンレイアウトを設定する（single/split-2/split-3/split-4）"""
    return f"layout set to {mode}"


@function_tool
def ui_open_app(app_id: str, screen_id: int) -> str:
    """指定スクリーンにアプリを開く"""
    return f"open {app_id} on screen {screen_id}"


@function_tool
def ui_highlight_element(selector: str) -> str:
    """UI 上の要素をハイライトする"""
    return f"highlight {selector}"


# --- Agents 定義（分散型パターンの例: Triage -> 専門エージェント群） ---
# 技術サポート
technical_support_agent = Agent(
    name="Technical Support Agent",
    instructions=(
        "You resolve technical issues, outages, or troubleshooting. "
        "Escalate only if missing context."
    ),
    tools=[ui_set_layout, ui_highlight_element],
)

# セールス
sales_agent = Agent(
    name="Sales Agent",
    instructions="You recommend plans/products and facilitate purchase steps.",
    tools=[ui_open_app],
)

# オーダー管理
order_management_agent = Agent(
    name="Order Management Agent",
    instructions="You track orders, update delivery status, or start refund flows.",
    tools=[ui_open_app, ui_highlight_element],
)

# 司令塔（振り分け）
triage_agent = Agent(
    name="Triage Agent",
    instructions=(
        "You are the first point of contact. Assess the query and hand off to the "
        "best specialized agent (technical support, sales, or order management). "
        "If the task is trivial, answer directly; otherwise hand off."
    ),
    handoffs=[technical_support_agent, sales_agent, order_management_agent],
)


def main() -> None:
    # グラフ生成（PNG 出力）。`format` を変えれば svg/pdf も可。
    draw_graph(triage_agent, filename="agent_graph", format="png").render()
    print("Generated agent_graph.png (triage pattern)")


if __name__ == "__main__":
    main()
