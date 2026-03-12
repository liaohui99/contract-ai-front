import { useState, useCallback, useRef } from 'react'
import { Send, Loader2, RefreshCw, Paperclip, X, FileText, Plus, Globe, BookOpen } from 'lucide-react'
import { cn } from '../lib/utils'

interface ChatInputProps {
  onSendMessage: (text: string, files: File[]) => void
  onNewChat: () => void
  isLoading: boolean
  hasMessages: boolean
}

/**
 * 聊天输入组件
 * 独立组件避免输入状态变化导致父组件重渲染
 */
export function ChatInput({ onSendMessage, onNewChat, isLoading, hasMessages }: ChatInputProps) {
  const [inputText, setInputText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [tools, setTools] = useState({
    internetSearch: true,
    customKnowledge: true
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSend = useCallback(() => {
    if ((!inputText.trim() && uploadedFiles.length === 0) || isLoading) return
    
    onSendMessage(inputText.trim() || '请分析这些文件', uploadedFiles)
    setInputText('')
    setUploadedFiles([])
  }, [inputText, uploadedFiles, isLoading, onSendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const toggleTool = useCallback((tool: keyof typeof tools) => {
    setTools(prev => ({ ...prev, [tool]: !prev[tool] }))
  }, [])

  const handlePlusClick = useCallback(() => {
    setIsDropdownOpen(!isDropdownOpen)
  }, [isDropdownOpen])

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
      setIsDropdownOpen(false)
    }
  }, [])

  return (
    <div className="border-t border-gray-200 bg-white p-6">
      <div className="max-w-4xl mx-auto">
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
        
        <div className="relative group" ref={dropdownRef} onBlur={handleBlur}>
          <div className="flex items-end gap-2 p-3 bg-white rounded-2xl border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm hover:shadow">
            <div className="flex items-center gap-1 flex-shrink-0 pb-2">
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

              {hasMessages && (
                <button
                  onClick={onNewChat}
                  className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-all"
                  title="新对话"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入您的问题或指令，支持 Shift+Enter 换行"
                className="w-full min-h-[40px] max-h-[160px] py-2 px-1 bg-transparent resize-none outline-none text-gray-800 placeholder-gray-400 text-base leading-relaxed"
                rows={1}
              />
            </div>

            <div className="flex-shrink-0 pb-1">
              <button
                onClick={handleSend}
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

          {isDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">选择工具</h3>
                <p className="text-xs text-gray-500 mt-1">选择需要启用的功能</p>
              </div>
              <div className="p-2 space-y-1">
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
  )
}
