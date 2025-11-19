-- モックデータ投入用SQL
-- 実行前に既存のデータをクリアする場合は以下を有効化してください
-- DELETE FROM store_plugins;

INSERT INTO store_plugins (
  plugin_id,
  name,
  description,
  long_description,
  author_name,
  category,
  tags,
  latest_version,
  download_count,
  average_rating,
  review_count,
  price,
  is_free,
  is_published,
  published_at,
  min_platform_version
) VALUES
(
  'com.acmelabs.crm',
  'CRM Manager',
  '顧客管理を自動化し、チームの対応を可視化するコアプラグイン。',
  '顧客情報の統合管理、パイプライン自動更新、レポート生成までワンクリック。SalesforceやHubSpotとも簡単連携可能。\n\n主な機能:\n- 顧客データベース管理\n- 商談パイプラインの可視化\n- 自動レポート生成\n- チーム内タスク割り当て',
  'Acme Labs',
  'ビジネス',
  ARRAY['公式', 'セキュリティ検証済み', 'CRM'],
  '2.1.0',
  10234,
  4.9,
  250,
  0,
  true,
  true,
  NOW() - INTERVAL '10 days',
  '1.0.0'
),
(
  'com.datagrid.analytics',
  'Analytics Pro',
  '売上とプロジェクトKPIをまとめた高機能ダッシュボード。',
  'リアルタイム売上チャート、プロジェクト別原価、アラート設定を1つのウィンドウで。チャットからもコマンド可能。\n\n特徴:\n- リアルタイムデータ更新\n- カスタムダッシュボード作成\n- PDF/Excelエクスポート',
  'DataGrid',
  '分析',
  ARRAY['トレンド', 'KPI'],
  '1.4.3',
  8650,
  4.7,
  158,
  2980,
  false,
  true,
  NOW() - INTERVAL '20 days',
  '1.0.0'
),
(
  'com.postaltech.mailbridge',
  'Mail Bridge',
  'メールとプロジェクトを同期し、やり取りをタイムライン化。',
  'Gmail/Outlookと双方向連携し、案件やチケットに自動紐づけ。メールテンプレや自動返信もサポート。',
  'Postal Tech',
  'コミュニケーション',
  ARRAY['メール', '効率化'],
  '3.0.0',
  7200,
  4.6,
  320,
  1480,
  false,
  true,
  NOW() - INTERVAL '30 days',
  '1.0.0'
),
(
  'com.flowtail.automation',
  'Automation Kit',
  'ワークフローをドラッグ&ドロップで自動化。200以上のアクションを搭載。',
  'if/else、遅延、繰り返しを GUI で配置し、自動入力や通知を実現。近日中にAIブロックも追加予定。',
  'Flowtail',
  'その他',
  ARRAY['新着', 'NoCode'],
  '0.9.0-beta',
  4200,
  4.4,
  90,
  0,
  true,
  true,
  NOW() - INTERVAL '2 days',
  '1.0.0'
);

-- レビューデータの投入（オプション）
-- 注意: user_id は実際のユーザーIDに置き換えるか、NULL許容の場合はNULLで挿入
-- ここではデモ用に user_id を省略できないため、コメントアウトしています。
-- 実際の環境でテストユーザーがいる場合に実行してください。

/*
INSERT INTO plugin_reviews (plugin_id, user_id, rating, title, comment)
SELECT 
  plugin_id,
  (SELECT id FROM auth.users LIMIT 1), -- 最初のユーザーを使用（要注意）
  5,
  '素晴らしいプラグイン',
  '業務効率が格段に上がりました！'
FROM store_plugins WHERE plugin_id = 'com.acmelabs.crm';
*/
