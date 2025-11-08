import { create } from 'zustand';

interface AppState {
  // タスク関連
  tasks: string[];
  addTask: (task: string) => void;
  removeTask: (index: number) => void;
  
  // スクリーン関連
  screens: string[];
  addScreen: (screen: string) => void;
  
  // メッセージ関連
  messages: Array<{ id: string; content: string; timestamp: Date }>;
  addMessage: (content: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // 初期状態
  tasks: [],
  screens: [],
  messages: [],
  
  // アクション
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
  
  removeTask: (index) =>
    set((state) => ({
      tasks: state.tasks.filter((_, i) => i !== index),
    })),
  
  addScreen: (screen) =>
    set((state) => ({
      screens: [...state.screens, screen],
    })),
  
  addMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: Date.now().toString(),
          content,
          timestamp: new Date(),
        },
      ],
    })),
}));

