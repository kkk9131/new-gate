import { create } from 'zustand';
import { useDesktopStore } from './desktopStore';

export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: number;
};

interface ChatStore {
    messages: Message[];
    isLoading: boolean;
    input: string;
    isSidebarOpen: boolean;
    selectedModel: string;
    selectedScreen: string;
    setInput: (input: string) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    setSelectedModel: (model: string) => void;
    setSelectedScreen: (screen: string) => void;
    addMessage: (message: Message) => void;
    updateLastMessage: (content: string) => void;
    sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    messages: [],
    isLoading: false,
    input: '',
    isSidebarOpen: true, // Default open
    selectedModel: 'gpt-4o',
    selectedScreen: 'auto',
    setInput: (input) => set({ input }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    setSelectedModel: (model) => set({ selectedModel: model }),
    setSelectedScreen: (screen) => set({ selectedScreen: screen }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    updateLastMessage: (content) => set((state) => {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!lastMessage) return state;
        return {
            messages: [
                ...state.messages.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + content }
            ]
        };
    }),
    sendMessage: async (content) => {
        const { addMessage, updateLastMessage } = get();

        if (!content.trim()) return;

        // Add user message
        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            createdAt: Date.now()
        };

        addMessage(userMsg);
        set({ input: '', isLoading: true });

        try {
            // Create placeholder for assistant message
            const assistantMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: 'Thinking...',
                createdAt: Date.now()
            };
            addMessage(assistantMsg);

            // Get all API keys from localStorage
            const apiKeys: Record<string, string> = {};
            try {
                const storedProviders = localStorage.getItem('llm_providers');
                if (storedProviders) {
                    const providers = JSON.parse(storedProviders);
                    providers.forEach((p: any) => {
                        if (p.key) {
                            const normalizedId = p.id === 'chatgpt' ? 'openai' : p.id;
                            apiKeys[normalizedId] = p.key;
                        }
                    });
                }

                if (!apiKeys['openai']) {
                    const fallbackOpenAI = localStorage.getItem('OPENAI_API_KEY');
                    if (fallbackOpenAI) {
                        apiKeys['openai'] = fallbackOpenAI;
                    }
                }
            } catch (e) {
                console.error('Failed to load API keys', e);
            }

            // Call Server API
            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: content, apiKeys }),
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let isFirstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line

                for (const line of lines) {
                    if (!line.trim()) continue;

                    // function_callなど生JSON配列は無視
                    if (line.trim().startsWith('[')) {
                        continue;
                    }

                    try {
                        const data = JSON.parse(line);

                        // type フィールドが無いものは無視
                        if (!data.type) continue;

                        if (data.type === 'action') {
                            const action = data.action;
                            const desktopStore = useDesktopStore.getState();

                            if (action.type === 'SET_LAYOUT') {
                                desktopStore.setLayout(action.payload.layout);
                            } else if (action.type === 'OPEN_APP') {
                                desktopStore.openAppInScreenForAgent(action.payload.appId, action.payload.screenId);
                                // Also open the actual window
                                const splitMode = desktopStore.splitMode;
                                let targetScreenKey = '';
                                const screenId = action.payload.screenId;

                                if (splitMode === 1) {
                                    desktopStore.openWindow(action.payload.appId);
                                } else {
                                    if (splitMode === 2) {
                                        targetScreenKey = screenId === 1 ? 'left' : 'right';
                                    } else if (splitMode === 3) {
                                        targetScreenKey = screenId === 1 ? 'left' : screenId === 2 ? 'topRight' : 'bottomRight';
                                    } else if (splitMode === 4) {
                                        targetScreenKey = screenId === 1 ? 'topLeft' : screenId === 2 ? 'topRight' : screenId === 3 ? 'bottomLeft' : 'bottomRight';
                                    }
                                    if (targetScreenKey) {
                                        desktopStore.openWindowInScreen(targetScreenKey, action.payload.appId as any);
                                    }
                                }
                            } else if (action.type === 'UPDATE_STATUS') {
                                desktopStore.updateScreenStatus(
                                    action.payload.screenId,
                                    action.payload.status,
                                    action.payload.progress
                                );
                                if (action.payload.status === 'error' || action.payload.status === 'retry') {
                                    const statusMsg: Message = {
                                        id: crypto.randomUUID(),
                                        role: 'assistant',
                                        content: `Screen ${action.payload.screenId}: ${action.payload.status === 'error' ? 'エラー発生' : 'リトライ中'}`,
                                        createdAt: Date.now()
                                    };
                                    addMessage(statusMsg);
                                }
                            } else if (action.type === 'LOG') {
                                // ログをチャット欄に追記（screenId付き）
                                const logMsg: Message = {
                                    id: crypto.randomUUID(),
                                    role: 'assistant',
                                    content: `Screen ${action.payload.screenId}: ${action.payload.message}`,
                                    createdAt: Date.now()
                                };
                                addMessage(logMsg);
                            } else if (action.type === 'CLOSE_ALL') {
                                desktopStore.closeAllWindows();
                            }
                        } else if (data.type === 'message') {
                            // function_call結果などが文字列で来てもチャットには載せない
                            if (typeof data.content === 'string' && data.content.trim().startsWith('[')) {
                                continue;
                            }
                            if (isFirstChunk) {
                                // Replace "Thinking..." with actual content
                                set((state) => {
                                    const msgs = [...state.messages];
                                    msgs[msgs.length - 1].content = data.content;
                                    return { messages: msgs };
                                });
                                isFirstChunk = false;
                            } else {
                                updateLastMessage(data.content);
                            }
                        } else if (data.type === 'error') {
                            console.error('Server Error:', data.error);
                            updateLastMessage(`\nError: ${data.error}`);
                        } else {
                            // その他のJSONイベントはチャットに出さない
                            continue;
                        }
                    } catch (e) {
                        console.error('Failed to parse chunk:', line, e);
                    }
                }
            }

        } catch (error: any) {
            console.error('Chat error:', error);
            updateLastMessage(`\nError: ${error.message}`);
        } finally {
            set({ isLoading: false });
        }
    }
}));
