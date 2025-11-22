'use client';

import { useRef, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { RiSendPlaneFill, RiRobot2Line, RiUser3Line } from 'react-icons/ri';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';
import { AppMentionMenu } from '../chat/AppMentionMenu';

export function ChatSidebar() {
    const { messages, input, setInput, sendMessage, isLoading } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionKeyword, setMentionKeyword] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        if (e.key === '@') {
            setMentionOpen(true);
            setMentionKeyword('');
        }
        if (e.key === 'Escape') {
            setMentionOpen(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);
        const cursor = e.target.selectionStart;
        const atIndex = val.lastIndexOf('@', cursor - 1);
        if (atIndex !== -1) {
            const keyword = val.slice(atIndex + 1, cursor);
            setMentionKeyword(keyword);
            setMentionOpen(true);
        } else {
            setMentionOpen(false);
        }
    };

    const handleSelectApp = (appId: string) => {
        if (!textareaRef.current) return;
        const val = textareaRef.current.value;
        const cursor = textareaRef.current.selectionStart;
        const atIndex = val.lastIndexOf('@', cursor - 1);
        if (atIndex !== -1) {
            const before = val.slice(0, atIndex);
            const after = val.slice(cursor);
            const newVal = `${before}@${appId} ${after}`;
            setInput(newVal);
            // 新しいカーソル位置
            const newPos = (before + `@${appId} `).length;
            requestAnimationFrame(() => {
                textareaRef.current!.focus();
                textareaRef.current!.selectionStart = textareaRef.current!.selectionEnd = newPos;
            });
        }
        setMentionOpen(false);
    };

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        sendMessage(input);
    };

    return (
        <div className="flex flex-col h-full bg-[#f5efe6] text-[#4a3b2e] border-l border-[#e3d6c4]">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-[#e3d6c4] bg-[#f0e7da]">
                <div className="w-8 h-8 rounded-lg bg-[#e4d7c3] flex items-center justify-center text-[#6a5846]">
                    <RiRobot2Line className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <h2 className="font-semibold text-sm">AI Workspace</h2>
                    <p className="text-xs text-[#7a6a59]">会話と進捗のハブ</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-[#7a6a59]/70 text-sm gap-2">
                        <RiRobot2Line className="w-8 h-8" />
                        <p>How can I help you today?</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className="flex justify-center">
                        <div className="w-full max-w-2xl space-y-1">
                            <div className="text-xs text-ink/50">
                                {msg.role === 'user' ? 'You' : 'Agent'}
                            </div>
                            <div
                                className={twMerge(
                                    "w-full p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words border shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-accent-sand text-ink border-white/20"
                                        : "bg-surface-strong text-ink border-white/10"
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#e3d6c4] bg-[#f0e7da] space-y-3">
                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <select
                        value={useChatStore(state => state.selectedModel)}
                        onChange={(e) => useChatStore.getState().setSelectedModel(e.target.value)}
                        className="bg-white/80 border border-[#d8c9b3] rounded-lg px-2 py-1 text-xs text-[#4a3b2e] focus:outline-none focus:border-[#b89f7a] cursor-pointer"
                    >
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gemini-pro">Gemini Pro</option>
                    </select>

                    {/* Screen Selector */}
                    <select
                        value={useChatStore(state => state.selectedScreen)}
                        onChange={(e) => useChatStore.getState().setSelectedScreen(e.target.value)}
                        className="bg-white/80 border border-[#d8c9b3] rounded-lg px-2 py-1 text-xs text-[#4a3b2e] focus:outline-none focus:border-[#b89f7a] cursor-pointer"
                    >
                        <option value="auto">Auto Screen</option>
                        <option value="screen-1">Screen 1</option>
                        <option value="screen-2">Screen 2</option>
                    </select>
                </div>

                <div className="relative flex items-end gap-2 bg-white/90 border border-[#d8c9b3] rounded-xl p-2 focus-within:border-[#b89f7a] transition-colors">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message...（@でアプリ指定）"
                        className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[24px] py-1 px-2 text-sm text-[#4a3b2e] placeholder:text-[#7a6a59]"
                        rows={1}
                        style={{ height: 'auto', minHeight: '24px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 rounded-lg bg-[#c8b08b] text-white hover:bg-[#b89f7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <RiSendPlaneFill className="w-4 h-4" />
                    </button>
                </div>
                <AppMentionMenu
                    anchorRef={textareaRef}
                    visible={mentionOpen}
                    keyword={mentionKeyword}
                    onSelect={handleSelectApp}
                />
            </div>
        </div>
    );
}
