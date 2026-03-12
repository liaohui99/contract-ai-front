import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react'
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
export const QuestionNavigator = memo(function QuestionNavigator({ 
  messages, 
  onJumpToMessage,
  currentUserMessageIndex
}: QuestionNavigatorProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const userMessages = useMemo(() => messages.filter((msg) => msg.role === 'user'), [messages])

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
  const truncateQuestion = (text: string, maxLength: number = 20) => {
    const cleanText = text.replace(/\n\[已上传 \d+ 个文件\]/g, '')
    if (cleanText.length <= maxLength) return cleanText
    return cleanText.slice(0, maxLength) + '...'
  }

  return (
    <div
      ref={containerRef}
      className="fixed right-4 top-1/2 -translate-y-1/2 z-50"
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
          "relative transition-opacity duration-200",
          isHovered ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="flex flex-col gap-3 items-center">
          {(() => {
            // 计算要显示的消息范围，确保当前消息在中间或可见
            let startIndex = Math.max(0, currentUserMessageIndex - 4)
            let endIndex = Math.min(userMessages.length, startIndex + 9)
            
            // 如果后面不够，从前面补
            if (endIndex - startIndex < 9) {
              startIndex = Math.max(0, endIndex - 9)
            }
            
            return userMessages.slice(startIndex, endIndex).map((msg, displayIndex) => {
              const actualIndex = startIndex + displayIndex
              const isCurrent = actualIndex === currentUserMessageIndex
              const isLarge = displayIndex % 2 === 0
              
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-full",
                    isLarge ? "h-0.5 w-5" : "h-0.5 w-3",
                    isCurrent
                      ? "bg-blue-600"
                      : "bg-gray-300 hover:bg-gray-400"
                  )}
                />
              )
            })
          })()}
        </div>
      </div>

      {/* 悬浮展开面板 */}
      <div
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 w-64 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden",
          "transition-all duration-200 ease-out",
          isHovered
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 translate-x-2 pointer-events-none"
        )}
        role="dialog"
        aria-label="历史问题列表"
      >
        {/* 面板标题 */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">中文回答</span>
        </div>

        {/* 问题列表 - 最多显示9条，超过则滚动 */}
        <div
          ref={listRef}
          className="max-h-[350px] overflow-y-auto px-3 pb-3"
          style={{ maxHeight: `${Math.min(userMessages.length * 40, 360)}px` }}
        >
          {userMessages.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-400 text-xs">暂无历史问题</p>
            </div>
          ) : (
            <div className="space-y-0.5">
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
                      "w-full text-left px-2.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 group relative",
                      isCurrent
                        ? "text-blue-600"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/50",
                      isFocused && "ring-2 ring-blue-500/30"
                    )}
                  >
                    {/* 当前位置标识 - 左侧蓝色条 */}
                    {isCurrent && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full" />
                    )}

                    {/* 问题内容 */}
                    <div className={cn("flex-1 min-w-0", isCurrent && "ml-0.5")}>
                      <p className={cn(
                        "text-xs font-normal truncate",
                        isCurrent ? "text-blue-600 font-medium" : "text-gray-600"
                      )}>
                        {truncateQuestion(msg.content)}
                      </p>
                    </div>

                    {/* 当前位置标识 - 右侧点 */}
                    {isCurrent && (
                      <div className="flex-shrink-0 w-1 h-1 bg-blue-600 rounded-full" />
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
})
