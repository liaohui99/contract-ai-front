/**
 * 聊天消息接口
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

/**
 * 聊天请求接口
 */
export interface ChatRequest {
  question: string
  sessionId: string
  files?: File[]
}

/**
 * 文件上传接口
 */
export interface UploadedFile {
  name: string
  size: number
  type: string
  url?: string
}

/**
 * 聊天响应接口
 */
export interface ChatResponse {
  id: string
  content: string
  conversationId: string
  timestamp: Date
}

/**
 * Agent状态接口
 */
export interface AgentStatus {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
  description?: string
}

/**
 * API错误响应接口
 */
export interface ApiError {
  code: string
  message: string
  details?: string
}
