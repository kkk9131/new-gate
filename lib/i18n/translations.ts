/**
 * 翻訳辞書
 *
 * UI言語の切り替えに使用する翻訳テキスト
 */

export const translations = {
  ja: {
    // 共通
    common: {
      backToDesktop: 'デスクトップに戻る',
      loading: '読み込み中...',
      saving: '保存中...',
      settings: '設定',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      close: '閉じる',
      submit: '送信',
      required: '必須',
    },

    // 言語設定ページ
    language: {
      title: '言語設定',
      uiLanguage: 'UI言語',
      japanese: '日本語',
      english: 'English',
      timezone: 'タイムゾーン',
      dateFormat: '日付フォーマット',
      timeFormat: '時刻フォーマット',
      time24h: '24時間制',
      time12h: '12時間制 (AM/PM)',
      autoSaveInfo: '設定は変更時に自動的に保存されます',
    },

    // プロフィールページ
    profile: {
      title: 'プロフィール情報',
      email: 'メールアドレス',
      userId: 'ユーザーID',
      accountCreated: 'アカウント作成日',
      passwordChange: 'パスワード変更',
      currentPassword: '現在のパスワード',
      newPassword: '新しいパスワード',
      confirmPassword: '新しいパスワード（確認）',
      currentPasswordPlaceholder: '現在のパスワードを入力',
      newPasswordPlaceholder: '6文字以上で入力',
      confirmPasswordPlaceholder: 'もう一度入力',
      passwordMinLength: '※ 6文字以上で入力してください',
      securityNote: '※ セキュリティのため、現在のパスワードを入力してください',
      changePassword: 'パスワードを変更',
      changing: '変更中...',
      unknownDate: '不明',
    },

    // 通知設定ページ
    notifications: {
      title: '通知設定',
      loadFailed: '通知設定の読み込みに失敗しました',
      notificationMethods: '通知方法',
      emailNotifications: 'メール通知',
      browserNotifications: 'ブラウザ通知',
      inAppNotifications: 'アプリ内通知',
      soundNotifications: '通知音',
      notificationCategories: '通知カテゴリ',
      agentTaskSuccess: 'エージェントタスク成功',
      agentTaskFailure: 'エージェントタスク失敗',
      securityAlerts: 'セキュリティアラート',
      platformUpdates: 'プラットフォーム更新',
      projectReminders: 'プロジェクトリマインダー',
      notificationTiming: '通知タイミング',
      immediate: '即時',
      batched: 'まとめて送信',
      businessHoursOnly: '営業時間のみ',
      batchInterval: 'まとめ送信間隔',
      businessHoursStart: '営業時間開始',
      businessHoursEnd: '営業時間終了',
      hours: '時間',
      autoSaveInfo: '設定は変更時に自動的に保存されます',
    },

    // セキュリティ設定ページ
    security: {
      title: 'セキュリティ設定',
      activeSessions: 'アクティブセッション',
      noActiveSessions: 'アクティブなセッションはありません',
      currentDevice: '現在のデバイス',
      unknownDevice: '不明なデバイス',
      unknownBrowser: '不明なブラウザ',
      ipAddress: 'IPアドレス',
      unknown: '不明',
      locationUnknown: '位置情報不明',
      lastAccess: '最終アクセス',
      logout: 'ログアウト',
      logoutAll: '全デバイスからログアウト',
      logoutAllConfirm: '全デバイスからログアウトしますか？（現在のセッションを除く）',
      logoutSessionConfirm: 'このセッションをログアウトしますか？',

      loginHistory: 'ログイン履歴',
      noLoginHistory: 'ログイン履歴はありません',
      exportCSV: 'CSVエクスポート',
      all: 'すべて',
      success: '成功',
      failed: '失敗',
      reason: '理由',
      unknownIP: '不明なIP',

      autoLogout: '自動ログアウト',
      autoLogoutDesc: '一定時間操作がない場合、自動的にログアウトします',
      minutes30: '30分',
      hour1: '1時間',
      hours3: '3時間',
      hours6: '6時間',
      hours24: '24時間',
      disabled: '無効',
    },

    // プロジェクトアプリ
    projects: {
      title: 'Projects',
      loading: '読み込み中...',
      loadingMore: '読み込み中...',
      error: 'エラーが発生しました',
      fetchError: 'プロジェクトの取得に失敗しました',

      // ステータスラベル
      statusPlanning: '企画',
      statusActive: '進行中',
      statusCompleted: '完了',
      statusOnHold: '保留',
      createError: 'プロジェクトの作成に失敗しました',
      updateError: 'プロジェクトの更新に失敗しました',
      deleteError: 'プロジェクトの削除に失敗しました',
      duplicateError: 'プロジェクトの複製に失敗しました',
      statusUpdateError: 'ステータスの更新に失敗しました',
      reorderError: '並び順の保存に失敗しました',
      noProjects: 'プロジェクトがありません',
      noProjectsHint: '「新規」ボタンからプロジェクトを作成してください',
      allLoaded: 'すべてのプロジェクトを表示しました',
      selectedCount: '{count}件 / {total}件を選択中',
      bulkDeleteConfirm: '{count}件のプロジェクトを削除しますか？',
      bulkDeleteError: '{count}件のプロジェクト削除に失敗しました',
      new: '新規',
      select: '選択',
      selectAll: '全選択',
      clearSelection: '選択解除',
      delete: '削除',
      deleteWithCount: '削除 ({count})',
      cancel: 'キャンセル',
      cardView: 'カード表示',
      listView: 'リスト表示',
      selectProject: 'プロジェクトを選択',
      sortProject: 'プロジェクトを並び替え',
      duplicate: '複製',
      duplicateProject: 'プロジェクトを複製',
      overdue: '⚠️ 期限切れ',
      onTime: '✓ 期限内',
      notes: '備考:',
      name: '名称',
      description: '説明',
      period: '期間',
      status: 'ステータス',
      notesColumn: '備考',
      actions: '操作',
      selectionMode: '選択モード',
      selectionModeEnd: '選択モード終了',
    },

    // 売上管理アプリ
    revenue: {
      // メインアプリ
      title: 'Revenue',
      descriptionText: '売上・経費管理と目標達成状況',
      dashboard: 'ダッシュボード',
      revenues: '売上',
      expenses: '経費',
      targets: '目標',

      // 共通
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      noData: 'データがありません',
      new: '新規',
      edit: '編集',
      delete: '削除',
      cancel: 'キャンセル',
      saving: '保存中...',
      create: '登録',
      update: '更新',
      close: '閉じる',
      project: 'プロジェクト',
      projectLabel: 'プロジェクト:',
      all: '全体',
      unassigned: '未割当',
      amount: '金額',
      date: '日付',
      category: 'カテゴリ',
      description: '説明',
      actions: '操作',
      required: '*',
      includingTax: '税込み',

      // 期間フィルター
      yearly: '年間',
      monthly: '月間',
      weekly: '週間',

      // 売上一覧
      revenueList: '売上一覧',
      revenueDate: '売上日',
      noRevenues: '売上データがありません',
      noRevenuesHint: '「新規」ボタンから売上を登録してください',
      revenueDeleteConfirm: '「{description}」を削除しますか？',
      revenueFallback: '売上',
      editRevenue: '売上を編集',
      deleteRevenue: '売上を削除',
      createRevenueTitle: '売上新規登録',
      editRevenueTitle: '売上編集',
      revenuePlaceholder: '売上の詳細を入力してください',
      categoryPlaceholder: '例: コンサルティング、制作費',
      fetchRevenuesError: '売上データの取得に失敗しました',
      createRevenueError: '売上の作成に失敗しました',
      updateRevenueError: '売上の更新に失敗しました',
      deleteRevenueError: '売上の削除に失敗しました',
      amountValidation: '金額は0より大きい値を入力してください',

      // 経費一覧
      expenseList: '経費一覧',
      expenseDate: '経費日',
      noExpenses: '経費データがありません',
      noExpensesHint: '「新規」ボタンから経費を登録してください',
      expenseDeleteConfirm: '「{description}」を削除しますか？',
      expenseFallback: '経費',
      editExpense: '経費を編集',
      deleteExpense: '経費を削除',
      createExpenseTitle: '経費新規登録',
      editExpenseTitle: '経費編集',
      expensePlaceholder: '経費の詳細を入力してください',
      fetchExpensesError: '経費データの取得に失敗しました',
      createExpenseError: '経費の作成に失敗しました',
      updateExpenseError: '経費の更新に失敗しました',
      deleteExpenseError: '経費の削除に失敗しました',

      // 経費カテゴリ
      uncategorized: '未分類',
      transportation: '交通費',
      communication: '通信費',
      supplies: '消耗品費',
      outsourcing: '外注費',
      advertising: '広告費',
      entertainment: '接待交際費',
      other: 'その他',

      // 目標一覧
      targetList: '目標一覧',
      noTargets: '目標データがありません',
      noTargetsHint: '「新規」ボタンから目標を設定してください',
      targetDeleteConfirm: '「{title}」を削除しますか？',
      editTarget: '目標を編集',
      deleteTarget: '目標を削除',
      createTargetTitle: '目標新規設定',
      editTargetTitle: '目標編集',
      titleLabel: 'タイトル',
      targetAmount: '目標金額',
      startDate: '開始日',
      endDate: '終了日',
      period: '期間',
      achievementRate: '達成率',
      overallTarget: '全体目標',
      targetPlaceholder: '目標の詳細を入力してください',
      titlePlaceholder: '例: 2025年1月目標',
      fetchTargetsError: '目標データの取得に失敗しました',
      createTargetError: '目標の作成に失敗しました',
      updateTargetError: '目標の更新に失敗しました',
      deleteTargetError: '目標の削除に失敗しました',
      titleValidation: 'タイトルを入力してください',
      targetAmountValidation: '目標金額は0より大きい値を入力してください',
      endDateValidation: '終了日を入力してください',
      endDateAfterStartValidation: '終了日は開始日以降の日付を指定してください',

      // ダッシュボード
      totalRevenue: '合計売上',
      totalExpense: '合計経費',
      grossProfit: '粗利',
      grossProfitRate: '粗利率: {rate}%',
      targetAchievement: '目標達成率',
      targetLabelDashboard: '目標: ¥{amount}',
      monthlyTrend: '月次推移',
      yearMonth: '{year}年{month}月',
      revenueLabel: '売上',
      expenseLabel: '経費',
      profitLabel: '粗利',
      fetchDashboardError: 'データの取得に失敗しました',
    },

    // カレンダーアプリ
    calendar: {
      // メインアプリ
      title: 'Calendar',
      loading: '読み込み中...',
      error: 'エラーが発生しました',

      // エラーメッセージ
      fetchError: 'イベントデータの取得に失敗しました',
      deleteError: 'イベントの削除に失敗しました',
      createError: 'イベントの作成に失敗しました',
      updateError: 'イベントの更新に失敗しました',

      // アクション
      newEvent: '新規イベント',
      edit: '編集',
      delete: '削除',
      deleteConfirm: '「{title}」を削除しますか？',

      // ナビゲーション
      today: '今日',
      next: '次へ',
      previous: '前へ',

      // ビュー
      month: '月',
      week: '週',
      day: '日',
      agenda: '予定表',

      // 今日の予定
      todaysSchedule: '今日の予定',
      noSchedule: '今日の予定はありません',
      allDay: '終日',

      // モーダル
      createEventTitle: 'イベント新規作成',
      editEventTitle: 'イベント編集',
      eventTitle: 'タイトル',
      location: '場所',
      project: 'プロジェクト',
      category: 'カテゴリ',
      color: '色',
      description: '説明',
      startTime: '開始',
      endTime: '終了',
      allDayEvent: '終日イベント',

      // プレースホルダー
      titlePlaceholder: 'イベントのタイトル',
      locationPlaceholder: 'オンライン、会議室など',
      descriptionPlaceholder: 'イベントの詳細を入力してください',

      // ドロップダウンオプション
      unassigned: '未割当',
      uncategorized: '未分類',

      // カテゴリ
      categoryMeeting: 'ミーティング',
      categoryTask: 'タスク',
      categoryEvent: 'イベント',
      categoryReminder: 'リマインダー',
      categoryOther: 'その他',

      // バリデーション
      titleRequired: 'タイトルを入力してください',
      endAfterStart: '終了時刻は開始時刻より後にしてください',

      // ボタン
      cancel: 'キャンセル',
      saving: '保存中...',
      create: '作成',
      update: '更新',
      close: '閉じる',
    },

    // 設定アプリ
    settings: {
      // メインアプリ
      title: 'Settings',

      // セクション
      profile: 'プロフィール',
      profileDesc: 'アカウント情報の管理',
      language: '言語設定',
      languageDesc: '言語とタイムゾーンの設定',
      notifications: '通知設定',
      notificationsDesc: '通知とアラートの設定',
      security: 'セキュリティ',
      securityDesc: 'パスワードとセキュリティ',
      theme: 'テーマ設定',
      themeDesc: '外観とカスタマイズ',
    },
  },

  en: {
    // Common
    common: {
      backToDesktop: 'Back to Desktop',
      loading: 'Loading...',
      saving: 'Saving...',
      settings: 'Settings',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      submit: 'Submit',
      required: 'Required',
    },

    // Language Settings Page
    language: {
      title: 'Language Settings',
      uiLanguage: 'UI Language',
      japanese: '日本語',
      english: 'English',
      timezone: 'Timezone',
      dateFormat: 'Date Format',
      timeFormat: 'Time Format',
      time24h: '24-hour',
      time12h: '12-hour (AM/PM)',
      autoSaveInfo: 'Settings are automatically saved when changed',
    },

    // Profile Page
    profile: {
      title: 'Profile Information',
      email: 'Email Address',
      userId: 'User ID',
      accountCreated: 'Account Created',
      passwordChange: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm New Password',
      currentPasswordPlaceholder: 'Enter current password',
      newPasswordPlaceholder: 'At least 6 characters',
      confirmPasswordPlaceholder: 'Enter again',
      passwordMinLength: '※ At least 6 characters required',
      securityNote: '※ For security, please enter your current password',
      changePassword: 'Change Password',
      changing: 'Changing...',
      unknownDate: 'Unknown',
    },

    // Notifications Settings Page
    notifications: {
      title: 'Notification Settings',
      loadFailed: 'Failed to load notification settings',
      notificationMethods: 'Notification Methods',
      emailNotifications: 'Email Notifications',
      browserNotifications: 'Browser Notifications',
      inAppNotifications: 'In-App Notifications',
      soundNotifications: 'Sound Notifications',
      notificationCategories: 'Notification Categories',
      agentTaskSuccess: 'Agent Task Success',
      agentTaskFailure: 'Agent Task Failure',
      securityAlerts: 'Security Alerts',
      platformUpdates: 'Platform Updates',
      projectReminders: 'Project Reminders',
      notificationTiming: 'Notification Timing',
      immediate: 'Immediate',
      batched: 'Batched',
      businessHoursOnly: 'Business Hours Only',
      batchInterval: 'Batch Interval',
      businessHoursStart: 'Business Hours Start',
      businessHoursEnd: 'Business Hours End',
      hours: 'hours',
      autoSaveInfo: 'Settings are automatically saved when changed',
    },

    // Security Settings Page
    security: {
      title: 'Security Settings',
      activeSessions: 'Active Sessions',
      noActiveSessions: 'No active sessions',
      currentDevice: 'Current Device',
      unknownDevice: 'Unknown Device',
      unknownBrowser: 'Unknown Browser',
      ipAddress: 'IP Address',
      unknown: 'Unknown',
      locationUnknown: 'Location Unknown',
      lastAccess: 'Last Access',
      logout: 'Logout',
      logoutAll: 'Logout All Devices',
      logoutAllConfirm: 'Logout from all devices? (except current session)',
      logoutSessionConfirm: 'Logout this session?',

      loginHistory: 'Login History',
      noLoginHistory: 'No login history',
      exportCSV: 'Export CSV',
      all: 'All',
      success: 'Success',
      failed: 'Failed',
      reason: 'Reason',
      unknownIP: 'Unknown IP',

      autoLogout: 'Auto Logout',
      autoLogoutDesc: 'Automatically logout after a period of inactivity',
      minutes30: '30 minutes',
      hour1: '1 hour',
      hours3: '3 hours',
      hours6: '6 hours',
      hours24: '24 hours',
      disabled: 'Disabled',
    },

    // Projects App
    projects: {
      title: 'Projects',
      loading: 'Loading...',
      loadingMore: 'Loading...',
      error: 'An error occurred',
      fetchError: 'Failed to fetch projects',

      // Status labels
      statusPlanning: 'Planning',
      statusActive: 'Active',
      statusCompleted: 'Completed',
      statusOnHold: 'On Hold',
      createError: 'Failed to create project',
      updateError: 'Failed to update project',
      deleteError: 'Failed to delete project',
      duplicateError: 'Failed to duplicate project',
      statusUpdateError: 'Failed to update status',
      reorderError: 'Failed to save order',
      noProjects: 'No projects',
      noProjectsHint: 'Create a new project from the "New" button',
      allLoaded: 'All projects displayed',
      selectedCount: '{count} / {total} selected',
      bulkDeleteConfirm: 'Delete {count} projects?',
      bulkDeleteError: 'Failed to delete {count} projects',
      new: 'New',
      select: 'Select',
      selectAll: 'Select All',
      clearSelection: 'Clear',
      delete: 'Delete',
      deleteWithCount: 'Delete ({count})',
      cancel: 'Cancel',
      cardView: 'Card View',
      listView: 'List View',
      selectProject: 'Select Project',
      sortProject: 'Sort Projects',
      duplicate: 'Duplicate',
      duplicateProject: 'Duplicate Project',
      overdue: '⚠️ Overdue',
      onTime: '✓ On Time',
      notes: 'Notes:',
      name: 'Name',
      description: 'Description',
      period: 'Period',
      status: 'Status',
      notesColumn: 'Notes',
      actions: 'Actions',
      selectionMode: 'Selection Mode',
      selectionModeEnd: 'End Selection',
    },

    // Revenue App
    revenue: {
      // Main app
      title: 'Revenue',
      descriptionText: 'Revenue & expense management and goal achievement status',
      dashboard: 'Dashboard',
      revenues: 'Revenues',
      expenses: 'Expenses',
      targets: 'Targets',

      // Common
      loading: 'Loading...',
      error: 'An error occurred',
      noData: 'No data available',
      new: 'New',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      saving: 'Saving...',
      create: 'Create',
      update: 'Update',
      close: 'Close',
      project: 'Project',
      projectLabel: 'Project:',
      all: 'All',
      unassigned: 'Unassigned',
      amount: 'Amount',
      date: 'Date',
      category: 'Category',
      description: 'Description',
      actions: 'Actions',
      required: '*',
      includingTax: 'Including tax',

      // Period filters
      yearly: 'Yearly',
      monthly: 'Monthly',
      weekly: 'Weekly',

      // Revenue List
      revenueList: 'Revenue List',
      revenueDate: 'Revenue Date',
      noRevenues: 'No revenue data',
      noRevenuesHint: 'Create revenue from the "New" button',
      revenueDeleteConfirm: 'Delete "{description}"?',
      revenueFallback: 'revenue',
      editRevenue: 'Edit revenue',
      deleteRevenue: 'Delete revenue',
      createRevenueTitle: 'New Revenue',
      editRevenueTitle: 'Edit Revenue',
      revenuePlaceholder: 'Enter revenue details',
      categoryPlaceholder: 'e.g.: Consulting, Production',
      fetchRevenuesError: 'Failed to fetch revenue data',
      createRevenueError: 'Failed to create revenue',
      updateRevenueError: 'Failed to update revenue',
      deleteRevenueError: 'Failed to delete revenue',
      amountValidation: 'Amount must be greater than 0',

      // Expense List
      expenseList: 'Expense List',
      expenseDate: 'Expense Date',
      noExpenses: 'No expense data',
      noExpensesHint: 'Create expense from the "New" button',
      expenseDeleteConfirm: 'Delete "{description}"?',
      expenseFallback: 'expense',
      editExpense: 'Edit expense',
      deleteExpense: 'Delete expense',
      createExpenseTitle: 'New Expense',
      editExpenseTitle: 'Edit Expense',
      expensePlaceholder: 'Enter expense details',
      fetchExpensesError: 'Failed to fetch expense data',
      createExpenseError: 'Failed to create expense',
      updateExpenseError: 'Failed to update expense',
      deleteExpenseError: 'Failed to delete expense',

      // Expense categories
      uncategorized: 'Uncategorized',
      transportation: 'Transportation',
      communication: 'Communication',
      supplies: 'Supplies',
      outsourcing: 'Outsourcing',
      advertising: 'Advertising',
      entertainment: 'Entertainment',
      other: 'Other',

      // Target List
      targetList: 'Target List',
      noTargets: 'No target data',
      noTargetsHint: 'Create target from the "New" button',
      targetDeleteConfirm: 'Delete "{title}"?',
      editTarget: 'Edit target',
      deleteTarget: 'Delete target',
      createTargetTitle: 'New Target',
      editTargetTitle: 'Edit Target',
      titleLabel: 'Title',
      targetAmount: 'Target Amount',
      startDate: 'Start Date',
      endDate: 'End Date',
      period: 'Period',
      achievementRate: 'Achievement Rate',
      overallTarget: 'Overall Target',
      targetPlaceholder: 'Enter target details',
      titlePlaceholder: 'e.g.: January 2025 Target',
      fetchTargetsError: 'Failed to fetch target data',
      createTargetError: 'Failed to create target',
      updateTargetError: 'Failed to update target',
      deleteTargetError: 'Failed to delete target',
      titleValidation: 'Please enter a title',
      targetAmountValidation: 'Target amount must be greater than 0',
      endDateValidation: 'Please enter an end date',
      endDateAfterStartValidation: 'End date must be after start date',

      // Dashboard
      totalRevenue: 'Total Revenue',
      totalExpense: 'Total Expense',
      grossProfit: 'Gross Profit',
      grossProfitRate: 'Gross Profit Rate: {rate}%',
      targetAchievement: 'Target Achievement',
      targetLabelDashboard: 'Target: ¥{amount}',
      monthlyTrend: 'Monthly Trend',
      yearMonth: '{month}/{year}',
      revenueLabel: 'Revenue',
      expenseLabel: 'Expense',
      profitLabel: 'Profit',
      fetchDashboardError: 'Failed to fetch data',
    },

    // Calendar App
    calendar: {
      // Main app
      title: 'Calendar',
      loading: 'Loading...',
      error: 'An error occurred',

      // Error messages
      fetchError: 'Failed to fetch event data',
      deleteError: 'Failed to delete event',
      createError: 'Failed to create event',
      updateError: 'Failed to update event',

      // Actions
      newEvent: 'New Event',
      edit: 'Edit',
      delete: 'Delete',
      deleteConfirm: 'Delete "{title}"?',

      // Navigation
      today: 'Today',
      next: 'Next',
      previous: 'Previous',

      // Views
      month: 'Month',
      week: 'Week',
      day: 'Day',
      agenda: 'Agenda',

      // Today's schedule
      todaysSchedule: "Today's Schedule",
      noSchedule: 'No schedule for today',
      allDay: 'All Day',

      // Modal
      createEventTitle: 'New Event',
      editEventTitle: 'Edit Event',
      eventTitle: 'Title',
      location: 'Location',
      project: 'Project',
      category: 'Category',
      color: 'Color',
      description: 'Description',
      startTime: 'Start',
      endTime: 'End',
      allDayEvent: 'All Day Event',

      // Placeholders
      titlePlaceholder: 'Event title',
      locationPlaceholder: 'Online, Meeting room, etc.',
      descriptionPlaceholder: 'Enter event details',

      // Dropdown options
      unassigned: 'Unassigned',
      uncategorized: 'Uncategorized',

      // Categories
      categoryMeeting: 'Meeting',
      categoryTask: 'Task',
      categoryEvent: 'Event',
      categoryReminder: 'Reminder',
      categoryOther: 'Other',

      // Validation
      titleRequired: 'Please enter a title',
      endAfterStart: 'End time must be after start time',

      // Buttons
      cancel: 'Cancel',
      saving: 'Saving...',
      create: 'Create',
      update: 'Update',
      close: 'Close',
    },

    // Settings App
    settings: {
      // Main app
      title: 'Settings',

      // Sections
      profile: 'Profile',
      profileDesc: 'Manage account information',
      language: 'Language',
      languageDesc: 'Language and timezone settings',
      notifications: 'Notifications',
      notificationsDesc: 'Configure notifications and alerts',
      security: 'Security',
      securityDesc: 'Password and security settings',
      theme: 'Theme',
      themeDesc: 'Appearance and customization',
    },
  },
} as const;

export type TranslationKey = keyof typeof translations;
export type Language = 'ja' | 'en';
