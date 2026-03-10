import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { ChatRequest, ChatResponse, AgentStatus, ApiError } from '../types/chat'
import type { ContractRiskReviewResponse, ContractRiskReviewRequest, ContractFileListResponse, ContractFileListRequest, ContractResp } from '../types/legal'

/**
 * API基础路径前缀
 */
const API_PREFIX = '/taorunhui'

/**
 * API服务类 - 用于与后端Agent智能体通信
 */
class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        const apiError: ApiError = {
          code: error.response?.data?.code || 'UNKNOWN_ERROR',
          message: error.response?.data?.message || error.message || '请求失败',
          details: error.response?.data?.details,
        }
        return Promise.reject(apiError)
      }
    )
  }

  /**
   * 发送聊天消息到Agent（非流式）
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    let fullContent = ''
    
    for await (const chunk of this.streamMessage(request)) {
      fullContent += chunk
    }
    
    return {
      id: Date.now().toString(),
      content: fullContent,
      conversationId: request.sessionId,
      timestamp: new Date(),
    }
  }

  /**
   * 流式发送聊天消息
   */
  async *streamMessage(request: ChatRequest): AsyncGenerator<string> {
    const url = `${API_PREFIX}/ai/simple/chat`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
      body: JSON.stringify({
        question: request.question,
        sessionId: request.sessionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is null')
    }

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        if (trimmedLine.startsWith('data:')) {
          try {
            let jsonStr = trimmedLine.substring(5).trim()
            
            const data = JSON.parse(jsonStr)
            
            if (data.messageType === 'continue' && data.content) {
              yield data.content
            } else if (data.messageType === 'complete') {
              return
            } else if (data.content) {
              yield data.content
            }
          } catch {
            const match = trimmedLine.match(/"content"\s*:\s*"([^"]*)"/)
            if (match && match[1]) {
              yield match[1]
            }
          }
        } else if (trimmedLine.startsWith('event:')) {
          continue
        } else if (!trimmedLine.startsWith(':') && trimmedLine.length > 0) {
          yield trimmedLine
        }
      }
    }
  }

  /**
   * 流式发送聊天消息（支持文件上传）
   */
  async *streamMessageWithFiles(
    question: string,
    sessionId: string,
    files: File[],
    netSearch: boolean = false,
    knowledgeBase: boolean = false
  ): AsyncGenerator<string> {
    const url = `${API_PREFIX}/ai/simple/chat`
    
    const formData = new FormData()
    formData.append('question', question)
    formData.append('sessionId', sessionId)
    formData.append('netSearch', String(netSearch))
    formData.append('knowledgeBase', String(knowledgeBase))
    
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is null')
    }

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        if (trimmedLine.startsWith('data:')) {
          try {
            let jsonStr = trimmedLine.substring(5).trim()
            
            const data = JSON.parse(jsonStr)
            
            if (data.messageType === 'continue' && data.content) {
              yield data.content
            } else if (data.messageType === 'complete') {
              return
            } else if (data.content) {
              yield data.content
            }
          } catch {
            const match = trimmedLine.match(/"content"\s*:\s*"([^"]*)"/)
            if (match && match[1]) {
              yield match[1]
            }
          }
        } else if (trimmedLine.startsWith('event:')) {
          continue
        } else if (!trimmedLine.startsWith(':') && trimmedLine.length > 0) {
          yield trimmedLine
        }
      }
    }
  }

  /**
   * 获取Agent状态
   */
  async getAgentStatus(): Promise<AgentStatus[]> {
    try {
      const response = await this.client.get<AgentStatus[]>(`${API_PREFIX}/api/agents/status`)
      return response.data
    } catch {
      return []
    }
  }

  /**
   * 获取会话历史
   */
  async getConversationHistory(conversationId: string): Promise<ChatResponse[]> {
    try {
      const response = await this.client.get<ChatResponse[]>(`${API_PREFIX}/api/conversations/${conversationId}/history`)
      return response.data
    } catch {
      return []
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get(`${API_PREFIX}/health`)
      return true
    } catch {
      return false
    }
  }

  /**
   * 流式发送法律检索请求（POST方式，参数在URL中）
   */
  async *streamLegalSearch(question: string, sessionId: string): AsyncGenerator<string> {
    const url = `${API_PREFIX}/ai/farui/chat?question=${encodeURIComponent(question)}&sessionId=${sessionId}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Response body is null')
    }

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        if (trimmedLine.startsWith('event:data')) {
          const content = trimmedLine.substring(10).trim()
          if (content) {
            yield content
          }
        } else if (trimmedLine.startsWith('data:')) {
          try {
            let jsonStr = trimmedLine.substring(5).trim()

            jsonStr = jsonStr
              .replace(/\\\\/g, '\\\\')
              .replace(/\\([^"\\])/g, '\\$1')

            const data = JSON.parse(jsonStr)

            if (data.messageType === 'continue' && data.content) {
              yield data.content
            } else if (data.messageType === 'complete') {
              break
            }
          } catch {
            const match = trimmedLine.match(/"content":"([^"]*)"/)
            if (match && match[1]) {
              yield match[1]
            }
          }
        } else if (trimmedLine.startsWith('event:')) {
          continue
        } else if (!trimmedLine.startsWith(':')) {
          yield trimmedLine
        }
      }
    }
  }

  /**
   * 生成唯一的sessionId
   */
  generateSessionId(): string {
    return `legal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * 合同风险审查接口
   * 调用后端接口进行合同风险分析
   * 
   * @param request 审查请求参数
   * @returns 结构化的审查结果
   */
  async contractRiskReview(request: ContractRiskReviewRequest): Promise<ContractRiskReviewResponse> {
    const url = `${API_PREFIX}/ai/contract/risk-review?question=${encodeURIComponent(request.question || '给出具体的参考法律法规')}&sessionId=${request.sessionId || '1'}`
    
    const formData = new FormData()
    formData.append('file', request.file)
    formData.append('reviewPosition', request.reviewPosition)
    formData.append('negotiationStatus', request.negotiationStatus)
    if (request.customRules) {
      formData.append('customRules', request.customRules)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ContractRiskReviewResponse = await response.json()
    return data
  }

  /**
   * 获取合同库文件列表
   * 调用后端接口获取已上传的文件列表
   * 
   * @param request 分页请求参数
   * @returns 文件列表响应数据
   */
  async getContractFileList(request: ContractFileListRequest): Promise<ContractFileListResponse> {
    const response = await this.client.get<ContractFileListResponse>(`${API_PREFIX}/rag/files`, {
      params: {
        pageNum: request.pageNum,
        pageSize: request.pageSize,
      },
    })

    return response.data
  }

  /**
   * 下载合同文件
   * 调用后端接口下载指定文件
   * 
   * @param fileName 文件名（包含UUID前缀）
   * @returns 文件Blob数据
   */
  async downloadContractFile(fileName: string): Promise<Blob> {
    const response = await fetch(`${API_PREFIX}/rag/download?fileName=${encodeURIComponent(fileName)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
    })

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }

    return response.blob()
  }

  /**
   * 获取文件预览URL
   * 返回可直接访问的预览地址
   * 
   * @param fileName 文件名（包含UUID前缀）
   * @returns 预览URL
   */
  getFilePreviewUrl(fileName: string): string {
    return `${API_PREFIX}/rag/download?fileName=${encodeURIComponent(fileName)}`
  }

  /**
   * 上传合同文件
   * 调用后端接口上传文件
   * 
   * @param file 要上传的文件
   * @returns 上传结果
   */
  async uploadContractFile(file: File): Promise<void> {
    const url = `${API_PREFIX}/rag/upload`
    
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status}`)
    }
  }

  /**
   * 解析文件内容
   * 调用后端接口进行文件智能解析
   * 
   * @param file 要解析的文件
   * @returns 解析后的合同数据
   */
  async parseFile(file: File): Promise<ContractResp> {
    const url = `${API_PREFIX}/ai/file/parse`
    
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ContractResp = await response.json()
    return data
  }
}

export const apiService = new ApiService()
