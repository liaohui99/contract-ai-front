import { useState, useCallback, useEffect, useRef } from 'react'
import { Folder, FileText, Eye, Download, Trash2, Upload, Calendar, FileSpreadsheet, Search, ChevronLeft, ChevronRight, Loader2, X, Image as ImageIcon, FileCode } from 'lucide-react'
import type { ContractItem, ContractFileItem } from '../types/legal'
import { apiService } from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeHighlight from 'rehype-highlight'
import * as mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import 'highlight.js/styles/github.css'

/**
 * 数据模式切换标识
 * true = 使用静态测试数据（用于开发测试）
 * false = 调用后端接口获取正式数据
 */
const USE_MOCK_DATA = false

/**
 * 文件类型枚举
 */
type FileType = 'pdf' | 'image' | 'text' | 'markdown' | 'code' | 'office' | 'unknown'

/**
 * 获取文件类型
 */
const getFileType = (fileName: string): FileType => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  if (['pdf'].includes(ext)) return 'pdf'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) return 'image'
  if (['md', 'markdown'].includes(ext)) return 'markdown'
  if (['txt', 'log', 'csv'].includes(ext)) return 'text'
  if (['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'sass', 'less', 'xml', 'yaml', 'yml', 'py', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'sql', 'sh', 'bash', 'vue', 'svelte'].includes(ext)) return 'code'
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office'
  
  return 'unknown'
}

/**
 * 静态测试数据 - 用于开发测试
 */
const MOCK_CONTRACTS: ContractItem[] = [
  {
    id: '1',
    name: '劳动合同_张三_2024.docx',
    uploadDate: new Date('2024-03-01'),
    size: '245 KB',
    preview: '劳动合同'
  },
  {
    id: '2',
    name: '房屋租赁合同.docx',
    uploadDate: new Date('2024-02-28'),
    size: '189 KB',
    preview: '房屋租赁合同'
  },
  {
    id: '3',
    name: '采购合同_2024年度.pdf',
    uploadDate: new Date('2024-02-25'),
    size: '523 KB',
    preview: '采购合同'
  },
  {
    id: '4',
    name: '服务协议_V1.0.docx',
    uploadDate: new Date('2024-02-20'),
    size: '312 KB',
    preview: '服务协议'
  },
  {
    id: '5',
    name: '保密协议.docx',
    uploadDate: new Date('2024-02-18'),
    size: '156 KB',
    preview: '保密协议'
  },
  {
    id: '6',
    name: '股权转让协议.pdf',
    uploadDate: new Date('2024-02-15'),
    size: '678 KB',
    preview: '股权转让协议'
  }
]

/**
 * 将后端返回的文件数据转换为前端展示格式
 */
const convertFileToContractItem = (file: ContractFileItem): ContractItem => {
  return {
    id: file.fileName,
    name: file.originalName,
    uploadDate: new Date(file.uploadTime),
    size: file.fileSizeReadable,
    preview: file.originalName.replace(/\.[^/.]+$/, '')
  }
}

/**
 * 合同库组件
 * 显示和管理用户上传的所有合同
 */
export function ContractLibrary() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<ContractItem | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null)
  const [previewDocxHtml, setPreviewDocxHtml] = useState<string | null>(null)
  const [previewExcelData, setPreviewExcelData] = useState<string[][] | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [pagination, setPagination] = useState({
    pageNum: 1,
    pageSize: 12,
    total: 0,
    pages: 0
  })

  /**
   * 从后端加载文件列表
   */
  const loadContractsFromApi = useCallback(async (pageNum: number, pageSize: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.getContractFileList({ pageNum, pageSize })
      
      const contractItems = response.list.map((file) => convertFileToContractItem(file))
      
      setContracts(contractItems)
      setPagination({
        pageNum: response.pageNum,
        pageSize: response.pageSize,
        total: response.total,
        pages: response.pages
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文件列表失败')
      setContracts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 加载静态测试数据
   */
  const loadMockContracts = useCallback(() => {
    setContracts(MOCK_CONTRACTS)
    setPagination({
      pageNum: 1,
      pageSize: 12,
      total: MOCK_CONTRACTS.length,
      pages: 1
    })
  }, [])

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    if (USE_MOCK_DATA) {
      loadMockContracts()
    } else {
      loadContractsFromApi(pagination.pageNum, pagination.pageSize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * 删除合同
   */
  const handleDelete = useCallback((id: string) => {
    if (confirm('确定要删除这个合同吗？')) {
      setContracts(prev => prev.filter(c => c.id !== id))
    }
  }, [])

  /**
   * 根据文件名获取MIME类型
   */
  const getMimeType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'ico': 'image/x-icon',
      'txt': 'text/plain',
      'log': 'text/plain',
      'csv': 'text/csv',
      'md': 'text/markdown',
      'markdown': 'text/markdown',
      'json': 'application/json',
      'js': 'text/javascript',
      'jsx': 'text/javascript',
      'ts': 'text/typescript',
      'tsx': 'text/typescript',
      'html': 'text/html',
      'css': 'text/css',
      'xml': 'text/xml',
      'yaml': 'text/yaml',
      'yml': 'text/yaml'
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }

  /**
   * 预览文件
   * 根据文件类型选择不同的预览方式
   */
  const handlePreview = useCallback(async (contract: ContractItem) => {
    if (USE_MOCK_DATA) {
      alert('测试模式下暂不支持预览')
      return
    }

    const fileType = getFileType(contract.name)
    
    if (fileType === 'unknown') {
      setPreviewFile(contract)
      return
    }

    setPreviewLoading(true)
    setPreviewFile(contract)
    setPreviewUrl(null)
    setPreviewTextContent(null)
    setPreviewDocxHtml(null)
    setPreviewExcelData(null)

    try {
      const blob = await apiService.downloadContractFile(contract.id)
      
      if (fileType === 'image' || fileType === 'pdf') {
        const mimeType = getMimeType(contract.name)
        const typedBlob = new Blob([blob], { type: mimeType })
        const url = window.URL.createObjectURL(typedBlob)
        setPreviewUrl(url)
      } else if (fileType === 'text' || fileType === 'markdown' || fileType === 'code') {
        const text = await blob.text()
        setPreviewTextContent(text)
      } else if (fileType === 'office') {
        const ext = contract.name.split('.').pop()?.toLowerCase() || ''
        
        if (ext === 'docx' || ext === 'doc') {
          const arrayBuffer = await blob.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setPreviewDocxHtml(result.value)
        } else if (ext === 'xlsx' || ext === 'xls') {
          const arrayBuffer = await blob.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]
          setPreviewExcelData(jsonData)
        } else {
          setPreviewFile(contract)
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '预览加载失败')
      setPreviewFile(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  /**
   * 关闭预览
   * 释放Blob URL避免内存泄漏
   */
  const handleClosePreview = useCallback(() => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPreviewFile(null)
    setPreviewTextContent(null)
    setPreviewDocxHtml(null)
    setPreviewExcelData(null)
  }, [previewUrl])

  /**
   * 下载文件
   */
  const handleDownload = useCallback(async (contract: ContractItem) => {
    if (USE_MOCK_DATA) {
      alert('测试模式下暂不支持下载')
      return
    }

    setDownloadingId(contract.id)
    
    try {
      const blob = await apiService.downloadContractFile(contract.id)
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = contract.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err instanceof Error ? err.message : '下载失败')
    } finally {
      setDownloadingId(null)
    }
  }, [])

  /**
   * 触发文件选择
   */
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /**
   * 处理文件上传
   */
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    try {
      await apiService.uploadContractFile(file)
      loadContractsFromApi(pagination.pageNum, pagination.pageSize)
      alert('上传成功')
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [loadContractsFromApi, pagination.pageNum, pagination.pageSize])

  /**
   * 获取文件图标
   */
  const getFileIcon = (name: string) => {
    const fileType = getFileType(name)
    
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />
      case 'image':
        return <ImageIcon className="w-8 h-8 text-purple-500" />
      case 'code':
        return <FileCode className="w-8 h-8 text-green-500" />
      case 'markdown':
      case 'text':
        return <FileText className="w-8 h-8 text-gray-600" />
      case 'office':
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
          return <FileSpreadsheet className="w-8 h-8 text-green-500" />
        }
        return <FileText className="w-8 h-8 text-blue-500" />
      default:
        return <FileText className="w-8 h-8 text-blue-500" />
    }
  }

  /**
   * 判断文件是否可预览
   */
  const isPreviewable = (name: string): boolean => {
    const fileType = getFileType(name)
    return fileType !== 'unknown'
  }

  /**
   * 过滤合同（仅在本地搜索时使用）
   */
  const filteredContracts = USE_MOCK_DATA 
    ? contracts.filter(contract => contract.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : contracts

  /**
   * 翻页处理
   */
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return
    
    if (USE_MOCK_DATA) {
      setPagination(prev => ({ ...prev, pageNum: newPage }))
    } else {
      loadContractsFromApi(newPage, pagination.pageSize)
    }
  }, [pagination.pages, pagination.pageSize, loadContractsFromApi])

  /**
   * 渲染分页控件
   */
  const renderPagination = () => {
    if (USE_MOCK_DATA || pagination.pages <= 1) return null
    
    return (
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => handlePageChange(pagination.pageNum - 1)}
          disabled={pagination.pageNum <= 1}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          上一页
        </button>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>第 {pagination.pageNum} / {pagination.pages} 页</span>
          <span className="text-gray-300">|</span>
          <span>共 {pagination.total} 条</span>
        </div>
        
        <button
          onClick={() => handlePageChange(pagination.pageNum + 1)}
          disabled={pagination.pageNum >= pagination.pages}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          下一页
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  /**
   * 渲染预览模态框
   */
  const renderPreviewModal = () => {
    if (!previewFile) return null

    const fileType = getFileType(previewFile.name)
    const canPreview = isPreviewable(previewFile.name)

    /**
     * 渲染预览内容
     */
    const renderPreviewContent = () => {
      if (previewLoading) {
        return (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">正在加载预览...</p>
          </div>
        )
      }

      switch (fileType) {
        case 'pdf':
          return previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200"
              title={previewFile.name}
            />
          ) : null

        case 'image':
          return previewUrl ? (
            <div className="flex items-center justify-center h-full min-h-[60vh] bg-gray-50 rounded-lg">
              <img
                src={previewUrl}
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : null

        case 'markdown':
          return previewTextContent ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[60vh] overflow-auto prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeHighlight]}
              >
                {previewTextContent}
              </ReactMarkdown>
            </div>
          ) : null

        case 'code':
          return previewTextContent ? (
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 min-h-[60vh] overflow-auto">
              <pre className="text-sm text-gray-100 overflow-x-auto">
                <code className={`language-${previewFile.name.split('.').pop()}`}>
                  {previewTextContent}
                </code>
              </pre>
            </div>
          ) : null

        case 'text':
          return previewTextContent ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[60vh] overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {previewTextContent}
              </pre>
            </div>
          ) : null

        case 'office':
          const ext = previewFile.name.split('.').pop()?.toLowerCase() || ''
          
          if ((ext === 'docx' || ext === 'doc') && previewDocxHtml) {
            return (
              <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[60vh] overflow-auto">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewDocxHtml }}
                />
              </div>
            )
          }
          
          if ((ext === 'xlsx' || ext === 'xls') && previewExcelData) {
            return (
              <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[60vh] overflow-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <tbody>
                    {previewExcelData.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-100 font-semibold' : ''}>
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex} 
                            className="border border-gray-300 px-3 py-2 text-sm"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
          
          return null

        default:
          return null
      }
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col m-4">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {getFileIcon(previewFile.name)}
              <div>
                <h3 className="font-semibold text-gray-800">{previewFile.name}</h3>
                <p className="text-sm text-gray-500">
                  {previewFile.uploadDate.toLocaleDateString('zh-CN')} · {previewFile.size}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload(previewFile)}
                disabled={downloadingId === previewFile.id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {downloadingId === previewFile.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                下载
              </button>
              <button
                onClick={handleClosePreview}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* 内容区 */}
          <div className="flex-1 overflow-auto p-4 bg-gray-100">
            {canPreview ? (
              renderPreviewContent() || (
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
                  <FileText className="w-20 h-20 text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">预览加载失败</h4>
                  <p className="text-gray-500 mb-6">请尝试下载文件后查看</p>
                  <button
                    onClick={() => handleDownload(previewFile)}
                    disabled={downloadingId === previewFile.id}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {downloadingId === previewFile.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    下载文件
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
                <FileText className="w-20 h-20 text-gray-300 mb-4" />
                <h4 className="text-lg font-medium text-gray-700 mb-2">暂不支持预览此文件类型</h4>
                <p className="text-gray-500 mb-6">
                  当前支持 PDF、图片、文本、代码、Markdown、Word、Excel 文件在线预览
                </p>
                <button
                  onClick={() => handleDownload(previewFile)}
                  disabled={downloadingId === previewFile.id}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {downloadingId === previewFile.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  下载文件
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /**
   * 渲染操作按钮
   */
  const renderActionButtons = (contract: ContractItem, isListView: boolean = false) => {
    const buttonSize = isListView ? 'p-2' : 'p-2'
    
    return (
      <>
        {isListView && (
          <button 
            onClick={() => handlePreview(contract)}
            className={`${buttonSize} text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
            title="预览"
          >
            <Eye className={isListView ? 'w-5 h-5' : 'w-4 h-4'} />
          </button>
        )}
        <button 
          onClick={() => handleDownload(contract)}
          disabled={downloadingId === contract.id}
          className={`${buttonSize} text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50`}
          title="下载"
        >
          {downloadingId === contract.id ? (
            <Loader2 className={`${isListView ? 'w-5 h-5' : 'w-4 h-4'} animate-spin`} />
          ) : (
            <Download className={isListView ? 'w-5 h-5' : 'w-4 h-4'} />
          )}
        </button>
        <button
          onClick={() => handleDelete(contract.id)}
          className={`${buttonSize} text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
          title="删除"
        >
          <Trash2 className={isListView ? 'w-5 h-5' : 'w-4 h-4'} />
        </button>
      </>
    )
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Folder className="w-8 h-8 text-blue-600" />
            合同库
            {USE_MOCK_DATA && (
              <span className="text-sm font-normal px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                测试模式
              </span>
            )}
          </h1>
          <p className="text-gray-600">管理您上传的所有合同文档</p>
        </div>

        {/* 工具栏 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索合同名称..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.png,.jpg,.jpeg,.gif,.svg"
              />
              <button 
                onClick={handleUploadClick}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                上传合同
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
            <p className="text-gray-600">正在加载合同列表...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !isLoading && (
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">加载失败</h3>
            <p className="text-red-500 mb-6">{error}</p>
            <button 
              onClick={() => loadContractsFromApi(pagination.pageNum, pagination.pageSize)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 合同列表 */}
        {!isLoading && !error && (
          <>
            {filteredContracts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">暂无合同</h3>
                <p className="text-gray-600 mb-6">上传您的第一份合同文档开始使用</p>
                <button 
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  上传合同
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContracts.map((contract) => (
                    <div key={contract.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all group">
                      <div className="p-6 pb-4">
                        <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                          {getFileIcon(contract.name)}
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2 truncate" title={contract.name}>
                          {contract.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <Calendar className="w-4 h-4" />
                          <span>{contract.uploadDate.toLocaleDateString('zh-CN')}</span>
                          <span className="text-gray-300">•</span>
                          <span>{contract.size}</span>
                        </div>
                      </div>
                      <div className="px-6 pb-6 flex items-center gap-2">
                        <button 
                          onClick={() => handlePreview(contract)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          预览
                        </button>
                        {renderActionButtons(contract)}
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination()}
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">合同名称</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">上传日期</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">大小</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredContracts.map((contract) => (
                          <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {getFileIcon(contract.name)}
                                <span className="font-medium text-gray-800">{contract.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {contract.uploadDate.toLocaleDateString('zh-CN')}
                            </td>
                            <td className="px-6 py-4 text-gray-600">{contract.size}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {renderActionButtons(contract, true)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {renderPagination()}
              </div>
            )}
          </>
        )}
      </div>

      {/* 预览模态框 */}
      {renderPreviewModal()}
    </div>
  )
}
