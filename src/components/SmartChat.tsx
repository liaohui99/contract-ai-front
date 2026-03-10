import { useState, useCallback, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { Bot, User, Send, Loader2, RefreshCw, Paperclip, X, FileText, Plus, Globe, BookOpen, Settings2, Image as ImageIcon, Copy, Check, Edit2, ArrowDown } from 'lucide-react'
import type { ChatMessage } from '../types/chat'
import { MarkdownRenderer } from './MarkdownRenderer'
import { cn } from '../lib/utils'
import { apiService } from '../services/api'

interface SmartChatProps {
  onNewConversation?: () => void
}

/**
 * localStorage 存储键名
 */
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
  const [inputText, setInputText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [tools, setTools] = useState({
    internetSearch: true,
    customKnowledge: true
  })
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editInputText, setEditInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
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

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)])
    }
    // 立即重置 input 值，确保下次选择相同文件时也能触发 onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  /**
   * 触发文件选择（优化响应速度）
   */
  const handleFileButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      // 直接触发 click，避免任何延迟
      fileInputRef.current.click()
    }
  }, [])

  /**
   * 移除文件
   */
  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  /**
   * 发送消息
   */
  const handleSendMessage = useCallback(async () => {
    if ((!inputText.trim() && uploadedFiles.length === 0) || isLoading) return

    const userMessageContent = inputText.trim() || '请分析这些文件'
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent + (uploadedFiles.length > 0 ? `\n[已上传 ${uploadedFiles.length} 个文件]` : ''),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
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
      const currentFiles = [...uploadedFiles]
      setUploadedFiles([])

      const stream = apiService.streamMessageWithFiles(
        userMessageContent,
        sessionIdRef.current,
        currentFiles,
        tools.internetSearch,
        tools.customKnowledge
      )

      let accumulatedContent = ''
      
      for await (const chunk of stream) {
        accumulatedContent += chunk
        
        // 使用 flushSync 强制同步更新，确保流式渲染生效
        flushSync(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          )
        })
      }
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
  }, [inputText, uploadedFiles, isLoading, tools])

  /**
   * 开始新对话
   */
  const handleNewChat = useCallback(() => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
    // 生成新的 sessionId 并保存
    const newSessionId = apiService.generateSessionId()
    localStorage.setItem(SESSION_ID_KEY, newSessionId)
    sessionIdRef.current = newSessionId
    onNewConversation?.()
  }, [onNewConversation])

  /**
   * 处理快速问题
   */
  const handleQuickQuestion = useCallback((question: string) => {
    setInputText(question)
    textareaRef.current?.focus()
  }, [])

  /**
   * 切换工具开关状态
   */
  const toggleTool = useCallback((tool: keyof typeof tools) => {
    setTools(prev => ({
      ...prev,
      [tool]: !prev[tool]
    }))
  }, [])

  /**
   * 处理点击外部关闭下拉框
   */
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false)
    }
  }, [])

  /**
   * 处理加号按钮点击
   */
  const handlePlusClick = useCallback(() => {
    setIsDropdownOpen(!isDropdownOpen)
  }, [isDropdownOpen])

  /**
   * 监听点击外部事件
   */
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handleClickOutside])

  /**
   * 复制消息内容到剪贴板
   */
  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }, [])

  /**
   * 开始编辑用户消息
   */
  const handleStartEditMessage = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditInputText(content)
  }, [])

  /**
   * 取消编辑用户消息
   */
  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null)
    setEditInputText('')
  }, [])

  /**
   * 保存编辑后的用户消息
   */
  const handleSaveEditMessage = useCallback(async (messageId: string, messageIndex: number) => {
    if (!editInputText.trim()) return
    
    // 更新当前消息内容
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex
          ? { ...msg, content: editInputText.trim() }
          : msg
      )
    )
    
    // 删除此消息之后的所有 AI 回复
    setMessages((prev) => {
      const newMessages = prev.slice(0, messageIndex + 1)
      return newMessages
    })
    
    setEditingMessageId(null)
    setEditInputText('')
    
    // 自动发送修改后的消息，获取新的 AI 回复
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
        tools.internetSearch,
        tools.customKnowledge
      )
      
      let accumulatedContent = ''
      
      for await (const chunk of stream) {
        accumulatedContent += chunk
        
        flushSync(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newAssistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          )
        })
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
  }, [editInputText, tools])

  /**
   * 重新生成 AI 回答
   */
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
        tools.internetSearch,
        tools.customKnowledge
      )
      
      let accumulatedContent = ''
      
      for await (const chunk of stream) {
        accumulatedContent += chunk
        
        flushSync(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newAssistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          )
        })
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
  }, [isLoading, messages, tools])

  /**
   * 保存消息到 localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch (error) {
      console.error('Failed to save messages to localStorage:', error)
    }
  }, [messages])

  /**
   * 处理滚动事件，判断是否显示滚动到底部按钮
   */
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    const { scrollTop, scrollHeight, clientHeight } = container
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollToBottom(!isNearBottom)
  }, [])

  /**
   * 滚动到底部
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  /**
   * 监听滚动事件
   */
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll)
    handleScroll()
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll, messages.length])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 聊天内容区域 */}
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
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              您好，我是法律顾问
            </h2>
            <p className="text-gray-600 mb-8 max-w-lg">
              我拥有法律领域的专业理解和推理能力，是您身边的AI法律顾问。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
              {[
                { icon: '💬', title: '法律咨询', desc: '张三驾车与李四车辆发生交通事故，张三全责，张三...' },
                { icon: '📊', title: '类案推送', desc: '某公司研发了一种新型电池，获得了专利权。但后来...' },
                { icon: '📈', title: '案情分析', desc: '被问人：刘某某 问：我们是浙江省XXXXX派出所的...' },
                { icon: '⚖️', title: '司法推理', desc: '浙江某网络有限公司诉被告张三网络服务合同纠纷...' },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(item.desc)}
                  className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-semibold text-gray-800 mb-1">{item.title}</div>
                  <div className="text-sm text-gray-500 line-clamp-2">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1
              const isShowingLoading = isLoading && isLastMessage && message.role === 'assistant'
              const isRegenerating = regeneratingMessageId === message.id
              
              // 如果是正在加载中的最后一条 AI 消息，则不显示
              if (isShowingLoading) {
                return null
              }
              
              const isUserMessage = message.role === 'user'
              const isAssistantMessage = message.role === 'assistant'
              const prevMessage = index > 0 ? messages[index - 1] : null
              const isPreviousUserMessage = prevMessage?.role === 'user'
              
              return (
                <div key={message.id} className="mb-10 animate-fade-in">
                  <div className={`flex gap-4 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
                    {isAssistantMessage && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <Bot className="w-5 h-5" />
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isUserMessage ? 'order-2' : 'order-1'} relative group`}>
                      {/* 编辑模式 */}
                      {isUserMessage && editingMessageId === message.id ? (
                        <div className="px-6 py-4 rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md">
                          <textarea
                            value={editInputText}
                            onChange={(e) => setEditInputText(e.target.value)}
                            className="w-full bg-white/10 rounded-lg px-3 py-2 text-white placeholder-blue-200 outline-none resize-none min-h-[80px]"
                            placeholder="请输入您的问题..."
                            autoFocus
                          />
                          <div className="flex gap-2 mt-3 justify-end">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-all"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleSaveEditMessage(message.id, index)}
                              disabled={!editInputText.trim()}
                              className="px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              保存并重新发送
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 显示模式 */
                        <div
                          className={`px-6 py-4 rounded-2xl shadow-lg ${
                            isUserMessage
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                          }`}
                        >
                          {isUserMessage ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <MarkdownRenderer content={message.content} />
                          )}
                          <div className={`text-xs mt-2 ${isUserMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* 用户消息的操作按钮 - 悬浮时显示在气泡下方 */}
                      {isUserMessage && editingMessageId !== message.id && (
                        <div className="absolute -bottom-9 right-0 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          <button
                            onClick={() => handleCopyMessage(message.id, message.content)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all text-xs text-gray-700 whitespace-nowrap flex-shrink-0"
                            title="复制"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedMessageId === message.id ? '已复制' : '复制'}
                          </button>
                          <button
                            onClick={() => handleStartEditMessage(message.id, message.content)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all text-xs text-gray-700 whitespace-nowrap flex-shrink-0"
                            title="改写"
                          >
                            <Edit2 className="w-3 h-3" />
                            改写
                          </button>
                        </div>
                      )}
                      
                      {/* AI 回答的操作按钮 - 悬浮时显示在气泡下方 */}
                      {isAssistantMessage && (
                        <div className="absolute -bottom-9 left-0 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          <button
                            onClick={() => handleCopyMessage(message.id, message.content)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all text-xs text-gray-700 whitespace-nowrap flex-shrink-0"
                            title="复制"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedMessageId === message.id ? '已复制' : '复制'}
                          </button>
                          {isPreviousUserMessage && (
                            <button
                              onClick={() => handleRegenerateMessage(message.id, index - 1)}
                              disabled={isRegenerating}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg transition-all text-xs text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                              title="重新生成"
                            >
                              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                              重新生成
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
            })}
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

        {/* 滚动到底部按钮 - 固定在可视区域右下角 */}
        {showScrollToBottom && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-8 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:shadow-xl transition-all duration-200 z-10"
            title="滚动到底部"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 bg-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* 文件列表展示 */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"
                >
                  <FileText className="w-4 h-4" />
                  <span className="max-w-[200px] truncate">{file.name}</span>
                  <span className="text-xs text-blue-600">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="ml-1 text-blue-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* 输入框容器 */}
          <div className="relative group" ref={dropdownRef}>
            <div className="flex items-end gap-2 p-3 bg-white rounded-2xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm hover:shadow">
              {/* 左侧：工具按钮组 */}
              <div className="flex items-center gap-1 flex-shrink-0 pb-2">
                {/* 加号按钮 - 打开工具选择器 */}
              <button
                onClick={handlePlusClick}
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  isDropdownOpen
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                )}
                title="选择工具"
              >
                <Plus
                  className={cn(
                    "w-5 h-5 transition-transform duration-300 ease-out",
                    isDropdownOpen && "rotate-45"
                  )}
                />
              </button>

                {/* 文件上传按钮 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={handleFileButtonClick}
                  className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-all"
                  title="上传文件"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* 新对话按钮（仅在有消息时显示） */}
                {messages.length > 0 && (
                  <button
                    onClick={handleNewChat}
                    className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-all"
                    title="新对话"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* 中间：文本输入区域 */}
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="请输入您的问题或指令，支持 Shift+Enter 换行"
                  className="w-full min-h-[40px] max-h-[160px] py-2 px-1 bg-transparent resize-none outline-none text-gray-800 placeholder-gray-400 text-base leading-relaxed"
                  rows={1}
                />
              </div>

              {/* 右侧：发送按钮 */}
              <div className="flex-shrink-0 pb-1">
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && uploadedFiles.length === 0) || isLoading}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-200",
                    "hover:shadow hover:scale-105 active:scale-95",
                    (!inputText.trim() && uploadedFiles.length === 0) || isLoading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 工具选择下拉框 */}
            {isDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">选择工具</h3>
                  <p className="text-xs text-gray-500 mt-1">选择需要启用的功能</p>
                </div>
                <div className="p-2 space-y-1">
                  {/* 联网搜索 */}
                  <button
                    onClick={() => toggleTool('internetSearch')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      tools.internetSearch ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"
                    )}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">联网搜索</span>
                        <div className={cn(
                          "w-10 h-6 rounded-full transition-colors relative",
                          tools.internetSearch ? "bg-green-500" : "bg-gray-300"
                        )}>
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                            tools.internetSearch ? "left-5 translate-x-0" : "left-1"
                          )} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">使用搜索引擎获取最新信息</p>
                    </div>
                  </button>

                  {/* 自定义知识库 */}
                  <button
                    onClick={() => toggleTool('customKnowledge')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      tools.customKnowledge ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
                    )}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">自定义知识库</span>
                        <div className={cn(
                          "w-10 h-6 rounded-full transition-colors relative",
                          tools.customKnowledge ? "bg-purple-500" : "bg-gray-300"
                        )}>
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                            tools.customKnowledge ? "left-5 translate-x-0" : "left-1"
                          )} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">访问企业内部知识库文档</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center text-xs text-gray-400">
            本服务生成内容由 AI 生成。我们不能保证生成内容无误、准确或完整。相关内容仅为您提供辅助参考，并不代表专业法律意见，不能替代专业人员的解答。
          </div>
        </div>
      </div>
    </div>
  )
}
