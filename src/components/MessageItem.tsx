import { memo, useCallback } from 'react'
import { Bot, User, Copy, Check, Edit2, RefreshCw } from 'lucide-react'
import type { ChatMessage } from '../types/chat'
import { MarkdownRenderer } from './MarkdownRenderer'

interface MessageItemProps {
  message: ChatMessage
  index: number
  isLastMessage: boolean
  isLoading: boolean
  regeneratingMessageId: string | null
  editingMessageId: string | null
  editInputText: string
  copiedMessageId: string | null
  prevMessage: ChatMessage | null
  onCopyMessage: (messageId: string, content: string) => void
  onStartEditMessage: (messageId: string, content: string) => void
  onCancelEdit: () => void
  onSaveEditMessage: (messageId: string, index: number) => void
  onRegenerateMessage: (messageId: string, userMessageIndex: number) => void
  onSetEditInputText: (text: string) => void
  setMessageRef: (index: number, el: HTMLDivElement | null) => void
}

/**
 * 消息项组件
 * 使用 memo 优化避免不必要的重渲染
 */
export const MessageItem = memo(function MessageItem({
  message,
  index,
  isLastMessage,
  isLoading,
  regeneratingMessageId,
  editingMessageId,
  editInputText,
  copiedMessageId,
  prevMessage,
  onCopyMessage,
  onStartEditMessage,
  onCancelEdit,
  onSaveEditMessage,
  onRegenerateMessage,
  onSetEditInputText,
  setMessageRef,
}: MessageItemProps) {
  const isShowingLoading = isLoading && isLastMessage && message.role === 'assistant'
  
  if (isShowingLoading) return null
  
  const isUserMessage = message.role === 'user'
  const isAssistantMessage = message.role === 'assistant'
  const isPreviousUserMessage = prevMessage?.role === 'user'
  const isRegenerating = regeneratingMessageId === message.id
  const isEditing = editingMessageId === message.id

  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSetEditInputText(e.target.value)
  }, [onSetEditInputText])

  return (
    <div
      ref={(el) => { setMessageRef(index, el) }}
      className="mb-10 animate-fade-in"
    >
      <div className={`flex gap-4 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
        {isAssistantMessage && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Bot className="w-5 h-5" />
          </div>
        )}
        <div className={`max-w-[75%] ${isUserMessage ? 'order-2' : 'order-1'} relative group`}>
          {isUserMessage && isEditing ? (
            <div className="px-6 py-4 rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md">
              <textarea
                value={editInputText}
                onChange={handleEditChange}
                className="w-full bg-white/10 rounded-lg px-3 py-2 text-white placeholder-blue-200 outline-none resize-none min-h-[80px]"
                placeholder="请输入您的问题..."
                autoFocus
              />
              <div className="flex gap-2 mt-3 justify-end">
                <button onClick={onCancelEdit} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-all">取消</button>
                <button onClick={() => onSaveEditMessage(message.id, index)} disabled={!editInputText.trim()} className="px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">保存并重新发送</button>
              </div>
            </div>
          ) : (
            <div className={`px-6 py-4 rounded-2xl shadow-lg ${isUserMessage ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'}`}>
              {isUserMessage ? <p className="whitespace-pre-wrap">{message.content}</p> : <MarkdownRenderer content={message.content} />}
              <div className={`text-xs mt-2 ${isUserMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
          
          {isUserMessage && !isEditing && (
            <div className="absolute -bottom-9 right-0 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              <button onClick={() => onCopyMessage(message.id, message.content)} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-all text-xs text-gray-700">
                {copiedMessageId === message.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copiedMessageId === message.id ? '已复制' : '复制'}
              </button>
              <button onClick={() => onStartEditMessage(message.id, message.content)} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-all text-xs text-gray-700">
                <Edit2 className="w-3 h-3" />改写
              </button>
            </div>
          )}
          
          {isAssistantMessage && (
            <div className="absolute -bottom-9 left-0 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              <button onClick={() => onCopyMessage(message.id, message.content)} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-all text-xs text-gray-700">
                {copiedMessageId === message.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                {copiedMessageId === message.id ? '已复制' : '复制'}
              </button>
              {isPreviousUserMessage && (
                <button onClick={() => onRegenerateMessage(message.id, index - 1)} disabled={isRegenerating} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition-all text-xs text-gray-700 disabled:opacity-50">
                  <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />重新生成
                </button>
              )}
            </div>
          )}
        </div>
        {isUserMessage && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg order-3">
            <User className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
})
