import { create } from 'zustand';

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
        const { addMessage, updateLastMessage, messages } = get();

        if (!content.trim()) return;

        // Add user message
        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            createdAt: Date.now()
        };

        // Prepare messages for API (current history + new user message)
        // We only send role and content to the API
        const apiMessages = [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
        }));

        addMessage(userMsg);
        set({ input: '', isLoading: true });

        try {
            // Create placeholder for assistant message
            const assistantMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: '',
                createdAt: Date.now()
            };
            addMessage(assistantMsg);

            // Get provider and key from localStorage
            const defaultProvider = localStorage.getItem('llm_default_provider') || 'openai';
            let apiKey = undefined;

            try {
                const storedProviders = localStorage.getItem('llm_providers');
                if (storedProviders) {
                    const providers = JSON.parse(storedProviders);
                    const providerConfig = providers.find((p: any) => p.id === defaultProvider);
                    if (providerConfig && providerConfig.key) {
                        apiKey = providerConfig.key;
                    }
                }
            } catch (e) {
                console.error('Failed to load API key', e);
            }

            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    provider: defaultProvider,
                    apiKey
                })
            });

            if (!response.ok) throw new Error('Failed to send message');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value, { stream: true });
                updateLastMessage(text);
            }
        } catch (error) {
            console.error('Chat error:', error);
            // Add error message to chat
            const errorMsg: Message = {
                id: crypto.randomUUID(),
                role: 'system',
                content: 'Error: Failed to send message. Please try again.',
                createdAt: Date.now()
            };
            addMessage(errorMsg);
        } finally {
            set({ isLoading: false });
        }
    }
}));
