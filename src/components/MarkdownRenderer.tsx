import { memo, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { ImageIcon, Brain, ChevronDown, ChevronRight } from 'lucide-react'
import 'highlight.js/styles/github-dark.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface ThinkingBlock {
  content: string
  id: string
}

/**
 * 提取 thinking 标签内容
 * @param content 原始内容
 * @returns thinking 块数组和清理后的内容
 */
function extractThinkingBlocks(content: string): { thinkingBlocks: ThinkingBlock[], cleanedContent: string } {
  const thinkingBlocks: ThinkingBlock[] = []
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/gi
  
  let match
  let index = 0
  while ((match = thinkingRegex.exec(content)) !== null) {
    thinkingBlocks.push({
      content: match[1].trim(),
      id: `thinking-${index++}`
    })
  }
  
  const cleanedContent = content.replace(thinkingRegex, '').trim()
  
  return { thinkingBlocks, cleanedContent }
}

/**
 * 思考块组件
 * 可折叠的思考内容展示区域
 */
const ThinkingBlockComponent = memo(function ThinkingBlockComponent({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  return (
    <div className="thinking-block">
      <button
        onClick={toggleExpand}
        className="thinking-header"
        aria-expanded={isExpanded}
      >
        <Brain className="thinking-icon" />
        <span className="thinking-title">思考过程</span>
        {isExpanded ? (
          <ChevronDown className="thinking-chevron" />
        ) : (
          <ChevronRight className="thinking-chevron" />
        )}
      </button>
      {isExpanded && (
        <div className="thinking-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p({ children }: any) {
                return <p className="thinking-paragraph">{children}</p>
              },
              ul({ children }: any) {
                return <ul className="thinking-list">{children}</ul>
              },
              ol({ children }: any) {
                return <ol className="thinking-list ordered">{children}</ol>
              },
              li({ children }: any) {
                return <li className="thinking-list-item">{children}</li>
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
})

/**
 * Markdown 图片组件
 * 处理图片加载失败的情况，显示占位符
 */
const MarkdownImage = memo(function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [hasError, setHasError] = useState(false)

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  if (hasError || !src) {
    return (
      <div className="markdown-image-fallback">
        <ImageIcon className="w-8 h-8 text-gray-400" />
        <span className="text-sm text-gray-500 mt-2">{alt || '图片加载失败'}</span>
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={alt || ''} 
      className="markdown-image" 
      onError={handleError}
      loading="lazy"
    />
  )
})

/**
 * Markdown 渲染组件
 * 支持代码高亮、表格、列表等常见 Markdown 语法
 * 优化了换行符处理，避免过大的段落间距
 * 支持 thinking 标签的单独渲染
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const { thinkingBlocks, cleanedContent } = extractThinkingBlocks(content)
  
  const processedContent = cleanedContent
    .replace(/\\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
  
  return (
    <div className={`markdown-content ${className}`}>
      {thinkingBlocks.length > 0 && (
        <div className="thinking-blocks-container">
          {thinkingBlocks.map((block) => (
            <ThinkingBlockComponent key={block.id} content={block.content} />
          ))}
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ inline, className: codeClassName, children, ...props }: any) {
            return inline ? (
              <code className="inline-code" {...props}>
                {children}
              </code>
            ) : (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            )
          },
          pre({ children }: any) {
            return <pre className="code-block">{children}</pre>
          },
          table({ children }: any) {
            return (
              <div className="table-wrapper">
                <table className="markdown-table">{children}</table>
              </div>
            )
          },
          th({ children }: any) {
            return <th className="table-header">{children}</th>
          },
          td({ children }: any) {
            return <td className="table-cell">{children}</td>
          },
          ul({ children }: any) {
            return <ul className="markdown-list unordered">{children}</ul>
          },
          ol({ children }: any) {
            return <ol className="markdown-list ordered">{children}</ol>
          },
          li({ children }: any) {
            return <li className="markdown-list-item">{children}</li>
          },
          h1({ children }: any) {
            return <h1 className="markdown-heading h1">{children}</h1>
          },
          h2({ children }: any) {
            return <h2 className="markdown-heading h2">{children}</h2>
          },
          h3({ children }: any) {
            return <h3 className="markdown-heading h3">{children}</h3>
          },
          h4({ children }: any) {
            return <h4 className="markdown-heading h4">{children}</h4>
          },
          h5({ children }: any) {
            return <h5 className="markdown-heading h5">{children}</h5>
          },
          h6({ children }: any) {
            return <h6 className="markdown-heading h6">{children}</h6>
          },
          p({ children }: any) {
            return <p className="markdown-paragraph">{children}</p>
          },
          blockquote({ children }: any) {
            return <blockquote className="markdown-blockquote">{children}</blockquote>
          },
          a({ href, children }: any) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
                {children}
              </a>
            )
          },
          hr() {
            return <hr className="markdown-hr" />
          },
          strong({ children }: any) {
            return <strong className="markdown-strong">{children}</strong>
          },
          em({ children }: any) {
            return <em className="markdown-emphasis">{children}</em>
          },
          img({ src, alt }: any) {
            return <MarkdownImage src={src} alt={alt} />
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数：只有当 content 和 className 都相同时才跳过重渲染
  return prevProps.content === nextProps.content && prevProps.className === nextProps.className
})
