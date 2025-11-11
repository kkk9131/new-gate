import { create } from 'zustand';
import type { Project } from '@/types/revenue';

interface ProjectStore {
  // 状態
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  // アクション
  fetchProjects: () => Promise<void>;
  clearError: () => void;
}

// キャッシュ有効期間: 5分
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * プロジェクト一覧管理用のZustand store
 * - プロジェクト一覧の取得・キャッシュ管理
 * - エラーハンドリング
 * - 重複リクエスト防止
 */
export const useProjectStore = create<ProjectStore>((set, get) => ({
  // 初期状態
  projects: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  // プロジェクト一覧を取得（キャッシュ機能付き）
  fetchProjects: async () => {
    const state = get();

    // キャッシュが有効な場合はスキップ
    if (
      state.lastFetchedAt &&
      Date.now() - state.lastFetchedAt < CACHE_DURATION &&
      state.projects.length > 0
    ) {
      return;
    }

    // すでに取得中の場合はスキップ（重複リクエスト防止）
    if (state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/projects?limit=100');

      if (!response.ok) {
        throw new Error('プロジェクト一覧の取得に失敗しました');
      }

      const result = await response.json();
      const projects = result.data || [];

      set({
        projects,
        isLoading: false,
        error: null,
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'プロジェクト一覧の取得に失敗しました';

      set({
        isLoading: false,
        error: errorMessage,
      });

      console.error('Error fetching projects:', err);
    }
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));
