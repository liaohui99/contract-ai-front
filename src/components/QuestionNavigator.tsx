import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '../lib/utils'
import type { ChatMessage } from '../types/chat'

interface QuestionNavigatorProps {
  messages: ChatMessage[]
  onJumpToMessage: (index: number) => void
  currentUserMessageIndex: number
}

/**
 * 问题导航组件
 * 用于快速定位和跳转到历史用户问题
 */
export function QuestionNavigator({ 
  messages, 
  onJumpToMessage,
  currentUserMessageIndex
}: QuestionNavigatorProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 过滤出所有用户消息
  const userMessages = messages.filter((msg) => msg.role === 'user')

  // 获取原始索引
  const getUserMessageOriginalIndex = (userMsgIndex: number) => {
    let count = 0
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'user') {
        if (count === userMsgIndex) {
          return i
        }
        count++
      }
    }
    return -1
  }

  /**
   * 处理键盘导航
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isHovered || userMessages.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => 
          prev === null ? 0 : Math.min(prev + 1, userMessages.length - 1)
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => 
          prev === null ? userMessages.length - 1 : Math.max(prev - 1, 0)
        )
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex !== null) {
          const originalIndex = getUserMessageOriginalIndex(focusedIndex)
          onJumpToMessage(originalIndex)
        }
        break
      case 'Escape':
        setIsHovered(false)
        setFocusedIndex(null)
        break
    }
  }, [isHovered, userMessages.length, focusedIndex, onJumpToMessage])

  /**
   * 滚动到当前聚焦的项
   */
  useEffect(() => {
    if (focusedIndex !== null && listRef.current) {
      const item = listRef.current.children[focusedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  /**
   * 截取问题预览文本
   */
  const truncateQuestion = (text: string, maxLength: number = 25) => {
    const cleanText = text.replace(/\n\[已上传 \d+ 个文件\]/g, '')
    if (cleanText.length <= maxLength) return cleanText
    return cleanText.slice(0, maxLength) + '...'
  }

  return (
    <div
      ref={containerRef}
      className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setFocusedIndex(null)
      }}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="问题导航"
    >
      {/* 默认状态 - 右侧横条 */}
      <div
        className={cn(
          "relative transition-all duration-300",
          isHovered ? "opacity-0 pointer-events-none absolute right-0" : "opacity-100"
        )}
      >
        <div className="flex flex-col gap-1">
          {userMessages.slice(0, 9).map((msg, index) => {
            const isCurrent = index === currentUserMessageIndex
            return (
              <div
                key={msg.id}
                className={cn(
                  "w-2 h-8 rounded-l-lg transition-all duration-200",
                  isCurrent
                    ? "bg-blue-600"
                    : "bg-gray-300 hover:bg-gray-400"
                )}
              />
            )
          })}
        </div>
      </div>

      {/* 悬浮展开面板 */}
      <div
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 w-72 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden transition-all duration-300",
          isHovered
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 translate-x-4 pointer-events-none"
        )}
        role="dialog"
        aria-label="历史问题列表"
      >
        {/* 面板标题 */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">中文回答</span>
        </div>

        {/* 问题列表 - 最多显示9条，超过则滚动 */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto px-3 pb-4"
          style={{ maxHeight: `${Math.min(userMessages.length * 48, 432)}px` }}
        >
          {userMessages.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-400 text-sm">暂无历史问题</p>
            </div>
          ) : (
            <div className="space-y-1">
              {userMessages.map((msg, index) => {
                const originalIndex = getUserMessageOriginalIndex(index)
                const isCurrent = index === currentUserMessageIndex
                const isFocused = focusedIndex === index

                return (
                  <button
                    key={msg.id}
                    onClick={() => onJumpToMessage(originalIndex)}
                    onFocus={() => setFocusedIndex(index)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-3 group relative",
                      isCurrent
                        ? "text-blue-600"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50",
                      isFocused && "ring-2 ring-blue-500/30"
                    )}
                  >
                    {/* 当前位置标识 - 左侧蓝色条 */}
                    {isCurrent && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 rounded-r-full" />
                    )}

                    {/* 问题内容 */}
                    <div className={cn("flex-1 min-w-0", isCurrent && "ml-1")}>
                      <p className={cn(
                        "text-sm font-normal truncate",
                        isCurrent ? "text-blue-600 font-medium" : "text-gray-600"
                      )}>
                        {truncateQuestion(msg.content)}
                      </p>
                    </div>

                    {/* 当前位置标识 - 右侧点 */}
                    {isCurrent && (
                      <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
