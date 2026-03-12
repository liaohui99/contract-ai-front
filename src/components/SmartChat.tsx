import { useState, useCallback, useRef, useEffect } from 'react'
import { Bot, ArrowDown } from 'lucide-react'
import type { ChatMessage } from '../types/chat'
import { apiService } from '../services/api'
import { QuestionNavigator } from './QuestionNavigator'
import { ChatInput } from './ChatInput'
import { MessageItem } from './MessageItem'

interface SmartChatProps {
  onNewConversation?: () => void
}

const STORAGE_KEY = 'smart_chat_messages'
const SESSION_ID_KEY = 'smart_chat_session_id'

/**
 * 智能对话组件
 * 包含对话历史、消息展示和输入区域
 */
export function SmartChat({ onNewConversation }: SmartChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }
    } catch (error) {
      console.error('Failed to load messages from localStorage:', error)
    }
    return []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editInputText, setEditInputText] = useState('')
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [currentUserMessageIndex, setCurrentUserMessageIndex] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<(HTMLDivElement | null)[]>([])
  
  const sessionIdRef = useRef<string>(
    (() => {
      try {
        let savedSessionId = localStorage.getItem(SESSION_ID_KEY)
        if (!savedSessionId) {
          savedSessionId = apiService.generateSessionId()
          localStorage.setItem(SESSION_ID_KEY, savedSessionId)
        }
        return savedSessionId
      } catch (error) {
        console.error('Failed to load session ID from localStorage:', error)
        return apiService.generateSessionId()
      }
    })()
  )

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleSendMessage = useCallback(async (text: string, files: File[]) => {
    const userMessageContent = text || '请分析这些文件'
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent + (files.length > 0 ? `\n[已上传 ${files.length} 个文件]` : ''),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      console.log('[SmartChat] Starting stream request...')
      console.log('[SmartChat] userMessageContent:', userMessageContent)
      console.log('[SmartChat] sessionId:', sessionIdRef.current)
      console.log('[SmartChat] files:', files.length)
      
      const stream = apiService.streamMessageWithFiles(
        userMessageContent,
        sessionIdRef.current,
        files,
        true,
        true
      )

      let accumulatedContent = ''
      let chunkIndex = 0
      
      for await (const chunk of stream) {
        chunkIndex++
        console.log(`[SmartChat] Received chunk #${chunkIndex}:`, chunk)
        accumulatedContent += chunk
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        )
      }
      console.log(`[SmartChat] Stream complete, total chunks: ${chunkIndex}`)
    } catch (error) {
      console.error('Stream error:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: '抱歉，处理您的请求时出现错误，请稍后重试。' }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleNewChat = useCallback(() => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
    const newSessionId = apiService.generateSessionId()
    localStorage.setItem(SESSION_ID_KEY, newSessionId)
    sessionIdRef.current = newSessionId
    onNewConversation?.()
  }, [onNewConversation])

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = content
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }, [])

  const handleStartEditMessage = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditInputText(content)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null)
    setEditInputText('')
  }, [])

  const handleSaveEditMessage = useCallback(async (_messageId: string, messageIndex: number) => {
    if (!editInputText.trim()) return
    
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex
          ? { ...msg, content: editInputText.trim() }
          : msg
      )
    )
    
    setMessages((prev) => prev.slice(0, messageIndex + 1))
    
    setEditingMessageId(null)
    setEditInputText('')
    
    const newAssistantMessageId = (Date.now() + 1).toString()
    const newAssistantMessage: ChatMessage = {
      id: newAssistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    
    setMessages((prev) => [...prev, newAssistantMessage])
    setIsLoading(true)
    
    try {
      const stream = apiService.streamMessageWithFiles(
        editInputText.trim(),
        sessionIdRef.current,
        [],
        true,
        true
      )
      
      let accumulatedContent = ''
      
      for await (const chunk of stream) {
        accumulatedContent += chunk
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newAssistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        )
      }
    } catch (error) {
      console.error('Stream error:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newAssistantMessageId
            ? { ...msg, content: '抱歉，处理您的请求时出现错误，请稍后重试。' }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [editInputText, scrollToBottom])

  const handleRegenerateMessage = useCallback(async (messageId: string, userMessageIndex: number) => {
    if (isLoading) return
    
    const userMessage = messages[userMessageIndex]
    if (!userMessage || userMessage.role !== 'user') return
    
    setRegeneratingMessageId(messageId)
    setIsLoading(true)
    
    const newAssistantMessageId = (Date.now() + 1).toString()
    const newAssistantMessage: ChatMessage = {
      id: newAssistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    
    setMessages((prev) => {
      const newMessages = [...prev]
      newMessages.splice(userMessageIndex + 1, 1, newAssistantMessage)
      return newMessages
    })
    
    try {
      const stream = apiService.streamMessageWithFiles(
        userMessage.content.replace(/\n\[已上传 \d+ 个文件\]/g, ''),
        sessionIdRef.current,
        [],
        true,
        true
      )
      
      let accumulatedContent = ''
      
      for await (const chunk of stream) {
        accumulatedContent += chunk
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newAssistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        )
      }
    } catch (error) {
      console.error('Stream error:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newAssistantMessageId
            ? { ...msg, content: '抱歉，重新生成时出现错误，请稍后重试。' }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      setRegeneratingMessageId(null)
    }
  }, [isLoading, messages, scrollToBottom])

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      } catch (error) {
        console.error('Failed to save messages to localStorage:', error)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [messages])

  const handleJumpToMessage = useCallback((index: number) => {
    if (messageRefs.current[index]) {
      messageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      let userMsgCount = 0
      for (let i = 0; i <= index; i++) {
        if (messages[i]?.role === 'user') userMsgCount++
      }
      setCurrentUserMessageIndex(userMsgCount - 1)
    }
  }, [messages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    let rafId: number | null = null
    let lastScrollHeight = 0
    let lastUpdateIndex = -1
    let scrollThrottleTimer: ReturnType<typeof setTimeout> | null = null

    const handleScrollEvent = () => {
      if (scrollThrottleTimer) return
      
      scrollThrottleTimer = setTimeout(() => {
        scrollThrottleTimer = null
      }, 100)

      if (rafId) cancelAnimationFrame(rafId)
      
      rafId = requestAnimationFrame(() => {
        const { scrollTop, scrollHeight, clientHeight } = container
        
        setShowScrollToBottom(scrollHeight - scrollTop - clientHeight >= 100)
        
        if (messages.length === 0 || scrollHeight === lastScrollHeight) return
        lastScrollHeight = scrollHeight
        
        const containerRect = container.getBoundingClientRect()
        const viewportTop = containerRect.top
        const viewportBottom = containerRect.bottom
        const viewportCenter = viewportTop + containerRect.height / 2
        
        let closestUserIndex = 0
        let smallestDistance = Infinity
        let userMsgCount = 0
        
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i]
          if (msg.role === 'user') {
            const ref = messageRefs.current[i]
            if (ref) {
              const rect = ref.getBoundingClientRect()
              const messageCenter = rect.top + rect.height / 2
              const distance = Math.abs(messageCenter - viewportCenter)
              const isInViewport = rect.bottom >= viewportTop && rect.top <= viewportBottom
              const adjustedDistance = isInViewport ? distance : distance + 10000
              if (adjustedDistance < smallestDistance) {
                smallestDistance = adjustedDistance
                closestUserIndex = userMsgCount
              }
            }
            userMsgCount++
          }
        }
        
        if (closestUserIndex !== lastUpdateIndex) {
          lastUpdateIndex = closestUserIndex
          setCurrentUserMessageIndex(closestUserIndex)
        }
      })
    }

    container.addEventListener('scroll', handleScrollEvent, { passive: true })
    handleScrollEvent()
    
    return () => {
      container.removeEventListener('scroll', handleScrollEvent)
      if (rafId) cancelAnimationFrame(rafId)
      if (scrollThrottleTimer) clearTimeout(scrollThrottleTimer)
    }
  }, [messages])

  useEffect(() => {
    if (messages.length > 0) scrollToBottom()
  }, [messages.length, scrollToBottom])

  return (
    <div className="flex flex-col h-full bg-white relative">
      {messages.length > 0 && (
        <QuestionNavigator
          messages={messages}
          onJumpToMessage={handleJumpToMessage}
          currentUserMessageIndex={currentUserMessageIndex}
        />
      )}
      
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={messagesContainerRef}
          className="absolute inset-0 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-blue-50"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-8">
                <img src="/src/assets/law_agent_icon.png" alt="法律顾问" className="w-24 h-24 rounded-3xl shadow-2xl" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">您好，我是法律顾问</h2>
              <p className="text-gray-600 mb-8 max-w-lg">我拥有法律领域的专业理解和推理能力，是您身边的AI法律顾问。</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  index={index}
                  isLastMessage={index === messages.length - 1}
                  isLoading={isLoading}
                  regeneratingMessageId={regeneratingMessageId}
                  editingMessageId={editingMessageId}
                  editInputText={editInputText}
                  copiedMessageId={copiedMessageId}
                  prevMessage={index > 0 ? messages[index - 1] : null}
                  onCopyMessage={handleCopyMessage}
                  onStartEditMessage={handleStartEditMessage}
                  onCancelEdit={handleCancelEdit}
                  onSaveEditMessage={handleSaveEditMessage}
                  onRegenerateMessage={handleRegenerateMessage}
                  onSetEditInputText={setEditInputText}
                  setMessageRef={(idx, el) => { messageRefs.current[idx] = el }}
                />
              ))}
              {isLoading && (
                <div className="flex gap-4 mb-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-lg">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {showScrollToBottom && messages.length > 0 && (
          <button onClick={scrollToBottom} className="absolute bottom-4 right-8 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all z-10" title="滚动到底部">
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        onNewChat={handleNewChat}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
      />
    </div>
  )
}
