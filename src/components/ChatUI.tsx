import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, User, Bot, Sparkles } from 'lucide-react'
import type { ChatMessage } from '../types/chat'
import { MarkdownRenderer } from './MarkdownRenderer'
import { cn } from '../lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * 聊天输入组件
 * 支持多行输入、快捷键发送和加载状态显示
 */
export function ChatInput({ onSend, disabled = false, placeholder = '输入消息...' }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 p-4 md:p-6 bg-card border-t border-border/50">
      <div className="flex-1 relative group">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          autoComplete="off"
          className={cn(
            "w-full px-5 py-3 md:px-6 md:py-3.5 rounded-2xl",
            "bg-background border border-border shadow-sm",
            "focus:border-primary focus:ring-4 focus:ring-primary/10 focus:shadow-md",
            "hover:border-border/70",
            "resize-none outline-none transition-all duration-200",
            "disabled:bg-muted disabled:cursor-not-allowed disabled:shadow-none",
            "text-foreground placeholder:text-muted-foreground",
            "text-sm md:text-base"
          )}
          style={{ maxHeight: '200px' }}
        />
        <div className="absolute right-4 bottom-3 text-xs text-muted-foreground/50 opacity-0 group-focus-within:opacity-100 transition-opacity">
          Shift + Enter 换行…
        </div>
      </div>
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        aria-label={disabled ? "发送中…" : "发送消息"}
        className={cn(
          "flex-shrink-0 h-[46px] md:h-[54px] w-[46px] md:w-[54px] flex items-center justify-center rounded-2xl mb-0",
          "bg-gradient-to-br from-primary to-secondary text-primary-foreground",
          "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed",
          "transition-all duration-200",
          "shadow-md hover:shadow-xl hover:from-primary/90 hover:to-secondary/90",
          "transform hover:scale-105 active:scale-95 disabled:transform-none disabled:shadow-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        )}
      >
        {disabled ? (
          <Loader2 className="size-4.5 md:size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4.5 md:size-5" aria-hidden="true" />
        )}
      </button>
    </form>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
}

/**
 * 消息气泡组件
 * 根据消息角色显示不同样式
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn("flex gap-3 mb-6 animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 size-10 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-lg" aria-hidden="true">
          <Bot className="size-5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[75%] md:max-w-[70%] px-5 py-3 md:px-6 md:py-4 rounded-3xl shadow-lg",
          isUser
            ? "bg-gradient-primary text-primary-foreground rounded-br-lg"
            : "bg-card text-card-foreground rounded-bl-lg border border-border"
        )}
      >
        {isUser ? (
          <p className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm md:text-base break-words">
            <MarkdownRenderer content={message.content} />
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
          <p className={cn("text-xs", isUser ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {isUser && <Sparkles className="size-3 text-primary-foreground/60" aria-hidden="true" />}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 size-10 rounded-2xl bg-gradient-accent flex items-center justify-center text-primary-foreground shadow-lg" aria-hidden="true">
          <User className="size-5" />
        </div>
      )}
    </div>
  )
}

interface ChatContainerProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

/**
 * 聊天容器组件
 * 显示消息列表和加载状态
 */
export function ChatContainer({ messages, isLoading = false }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-fade-in">
          <div className="relative mb-6">
            <div className="size-20 rounded-3xl bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-2xl" aria-hidden="true">
              <Bot className="size-10" />
            </div>
            <div className="absolute -top-2 -right-2 size-6 rounded-full bg-gradient-accent flex items-center justify-center animate-bounce" aria-hidden="true">
              <Sparkles className="size-3 text-primary-foreground" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gradient mb-3">
            开始与AI助手对话
          </h3>
          <p className="text-base text-muted-foreground mb-2">输入您的问题，我会尽力帮助您</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {['如何使用？', '功能介绍', '帮助中心'].map((text, index) => (
              <button
                key={index}
                aria-label={`查看${text}`}
                className={cn(
                  "px-4 py-2 rounded-full bg-card border border-border",
                  "text-sm text-muted-foreground",
                  "hover:border-primary hover:text-primary",
                  "transition-all shadow-sm hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div key={message.id} style={{ animationDelay: `${index * 0.1}s` }}>
              <MessageBubble message={message} />
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 mb-6 animate-fade-in" role="status" aria-live="polite" aria-label="AI正在输入…">
              <div className="flex-shrink-0 size-10 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-lg" aria-hidden="true">
                <Bot className="size-5" />
              </div>
              <div className="bg-card px-6 py-4 rounded-3xl rounded-bl-lg shadow-lg border border-border">
                <div className="flex gap-2">
                  <span className="size-3 bg-gradient-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} aria-hidden="true"></span>
                  <span className="size-3 bg-gradient-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} aria-hidden="true"></span>
                  <span className="size-3 bg-gradient-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} aria-hidden="true"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}
