'use client';

import { useRef, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { RiSendPlaneFill, RiRobot2Line, RiUser3Line } from 'react-icons/ri';
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
        <div className="flex flex-col h-full bg-surface border-l border-white/20">
            {/* Header */}
            <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-surface-strong/50 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-accent-sand/20 flex items-center justify-center text-accent-sand">
                    <RiRobot2Line className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-ink">Agent</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-ink/40 text-sm gap-2">
                        <RiRobot2Line className="w-8 h-8" />
                        <p>How can I help you today?</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={twMerge(
                            "flex gap-3 max-w-[85%]"
                        )}
                    >
                        <div className={twMerge(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            msg.role === 'user' ? "bg-accent-sand text-ink" : "bg-surface-strong text-ink"
                        )}>
                            {msg.role === 'user' ? <RiUser3Line className="w-4 h-4" /> : <RiRobot2Line className="w-4 h-4" />}
                        </div>

                        <div className={twMerge(
                            "p-3 text-sm leading-relaxed whitespace-pre-wrap",
                            msg.role === 'user'
                                ? "bg-cloud text-ink rounded-xl border border-white/20 shadow-sm"
                                : "bg-transparent text-ink p-1 rounded-none"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-surface-strong/30 space-y-3">
                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <select
                        value={useChatStore(state => state.selectedModel)}
                        onChange={(e) => useChatStore.getState().setSelectedModel(e.target.value)}
                        className="bg-surface border border-white/20 rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:border-accent-sand cursor-pointer"
                    >
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gemini-pro">Gemini Pro</option>
                    </select>

                    {/* Screen Selector */}
                    <select
                        value={useChatStore(state => state.selectedScreen)}
                        onChange={(e) => useChatStore.getState().setSelectedScreen(e.target.value)}
                        className="bg-surface border border-white/20 rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:border-accent-sand cursor-pointer"
                    >
                        <option value="auto">Auto Screen</option>
                        <option value="screen-1">Screen 1</option>
                        <option value="screen-2">Screen 2</option>
                    </select>
                </div>

                <div className="relative flex items-end gap-2 bg-surface border border-white/20 rounded-xl p-2 focus-within:border-accent-sand/50 transition-colors">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message...（@でアプリ指定）"
                        className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[24px] py-1 px-2 text-sm text-ink placeholder:text-ink/40"
                        rows={1}
                        style={{ height: 'auto', minHeight: '24px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 rounded-lg bg-accent-sand text-ink hover:bg-accent-sand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
