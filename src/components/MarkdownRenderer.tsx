import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Markdown 渲染组件
 * 支持代码高亮、表格、列表等常见 Markdown 语法
 * 优化了换行符处理，避免过大的段落间距
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // 预处理内容：
  // 1. 将字面量的 \n 转换为真正的换行符
  // 2. 将多个连续换行符压缩为两个换行符（保留段落分隔）
  const processedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
  
  return (
    <div className={`markdown-content ${className}`}>
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
            return <img src={src} alt={alt} className="markdown-image" />
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
