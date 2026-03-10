import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, BookOpen, Scale, FileText, ExternalLink, Filter, AlertCircle, RefreshCw } from 'lucide-react'
import { apiService } from '../services/api'
import { MarkdownRenderer } from './MarkdownRenderer'

interface SearchResult {
  id: string
  title: string
  type: 'law' | 'case' | 'regulation'
  content: string
  source: string
  date: string
}

interface SearchHistory {
  question: string
  answer: string
  timestamp: Date
}

/**
 * 法律检索组件
 * 提供法律法规、案例等法律资源的检索功能，支持流式响应
 */
export function LegalSearch() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'law' | 'case' | 'regulation'>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [streamContent])

  /**
   * 执行法律检索（流式响应）
   */
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)
    setStreamContent('')
    setResults([])

    const sessionId = apiService.generateSessionId()

    try {
      abortControllerRef.current = new AbortController()
      let fullContent = ''

      for await (const chunk of apiService.streamLegalSearch(query, sessionId)) {
        fullContent += chunk
        setStreamContent(fullContent)
      }

      setSearchHistory(prev => [
        { question: query, answer: fullContent, timestamp: new Date() },
        ...prev.slice(0, 9)
      ])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : '检索失败，请稍后重试')
    } finally {
      setIsSearching(false)
      abortControllerRef.current = null
    }
  }, [query])

  /**
   * 停止检索
   */
  const handleStopSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsSearching(false)
  }, [])

  /**
   * 清空结果
   */
  const handleClear = useCallback(() => {
    setQuery('')
    setStreamContent('')
    setError(null)
    setResults([])
  }, [])

  /**
   * 获取类型图标
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'law':
        return <BookOpen className="w-5 h-5 text-blue-600" />
      case 'case':
        return <Scale className="w-5 h-5 text-purple-600" />
      case 'regulation':
        return <FileText className="w-5 h-5 text-green-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  /**
   * 获取类型标签
   */
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'law':
        return '法律法规'
      case 'case':
        return '司法案例'
      case 'regulation':
        return '行政法规'
      default:
        return '其他'
    }
  }

  /**
   * 获取类型颜色
   */
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'law':
        return 'bg-blue-100 text-blue-800'
      case 'case':
        return 'bg-purple-100 text-purple-800'
      case 'regulation':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Search className="w-8 h-8 text-blue-600" />
            法律检索
          </h1>
          <p className="text-gray-600">智能检索法律法规、司法案例和法律条文</p>
        </div>

        {/* 搜索区域 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
                placeholder="请输入法律问题，如：合同纠纷如何处理、交通事故赔偿标准..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-gray-800"
                disabled={isSearching}
              />
            </div>
            {isSearching ? (
              <button
                onClick={handleStopSearch}
                className="px-8 py-3.5 bg-red-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                停止
              </button>
            ) : (
              <button
                onClick={handleSearch}
                disabled={!query.trim()}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                检索
              </button>
            )}
            {(streamContent || error) && (
              <button
                onClick={handleClear}
                className="px-6 py-3.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all flex items-center gap-2"
              >
                清空
              </button>
            )}
          </div>

          {/* 筛选标签 */}
          <div className="flex items-center gap-3 mt-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部' },
                { key: 'law', label: '法律法规' },
                { key: 'case', label: '司法案例' },
                { key: 'regulation', label: '行政法规' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">检索失败</h3>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={handleSearch}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  重试
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 流式响应结果 */}
        {streamContent && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                检索结果
              </h2>
              {isSearching && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">正在检索...</span>
                </div>
              )}
            </div>
            <div 
              ref={contentRef}
              className="prose prose-blue max-w-none text-gray-700 max-h-[500px] overflow-y-auto"
            >
              <MarkdownRenderer content={streamContent} />
            </div>
          </div>
        )}

        {/* 热门搜索 */}
        {!streamContent && !error && !isSearching && searchHistory.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">热门搜索</h2>
            <div className="flex flex-wrap gap-2">
              {['合同纠纷', '交通事故', '劳动仲裁', '离婚诉讼', '知识产权', '房产纠纷', '债权债务', '刑事辩护'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term)
                    setTimeout(() => handleSearch(), 0)
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-lg text-sm transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索历史 */}
        {searchHistory.length > 0 && !streamContent && !isSearching && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">搜索历史</h2>
            <div className="space-y-3">
              {searchHistory.map((item, index) => (
                <div 
                  key={index}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => {
                    setQuery(item.question)
                    setStreamContent(item.answer)
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{item.question}</span>
                    <span className="text-xs text-gray-500">
                      {item.timestamp.toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模拟搜索结果（备用） */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              找到 <span className="font-semibold text-gray-800">{results.length}</span> 条结果
            </div>
            {results.map((result) => (
              <div key={result.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{result.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{result.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>来源：{result.source}</span>
                        <span>日期：{result.date}</span>
                      </div>
                      <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm">
                        查看详情
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
