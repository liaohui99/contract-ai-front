export type LegalTab = 'chat' | 'document' | 'search' | 'reader' | 'contracts' | 'risk-review'

/**
 * 合同当事方信息（甲方/乙方）
 */
export interface ContractParty {
  /** 单位名称 */
  name?: string
  /** 法定代表人 */
  legalRepresentative?: string
  /** 委托代表人 */
  authorizedRepresentative?: string
  /** 电话 */
  phone?: string
  /** 传真 */
  fax?: string
  /** 开户行 */
  bank?: string
  /** 账号 */
  account?: string
}

/**
 * 采购物品/服务明细项
 */
export interface ContractOrderItem {
  /** 品名 */
  productName?: string
  /** 规格型号 */
  specification?: string
  /** 数量 */
  quantity?: number
  /** 单位 */
  unit?: string
  /** 单价 */
  unitPrice?: number
  /** 含税金额 */
  amount?: number
}

/**
 * 合同解析响应 - 后端返回的合同数据结构
 */
export interface ContractResp {
  /** 合同编号 */
  contractNo?: string
  /** 签订地点 */
  signPlace?: string
  /** 签订时间 */
  signDate?: string
  /** 甲方信息 */
  partyA?: ContractParty
  /** 乙方信息 */
  partyB?: ContractParty
  /** 采购物品/服务清单 */
  items?: ContractOrderItem[]
  /** 总金额（小写） */
  totalAmount?: number
  /** 总金额（大写） */
  totalAmountInWords?: string
  /** 交货/交付时间 */
  deliveryTime?: string
  /** 交货地点 */
  deliveryPlace?: string
  /** 技术标准/质量要求 */
  technicalStandard?: string
  /** 运费及费用承担 */
  freightTerms?: string
  /** 结算及支付方式 */
  paymentTerms?: string
  /** 违约责任 */
  penaltyClause?: string
  /** 争议解决方式 */
  disputeResolution?: string
  /** 其他约定 */
  otherProvisions?: string
  /** 签（公）证信息 */
  notarizationInfo?: string
}

export interface ContractItem {
  id: string
  name: string
  uploadDate: Date
  size: string
  preview: string
}

/**
 * 合同库文件项 - 后端返回的文件数据结构
 */
export interface ContractFileItem {
  fileName: string
  originalName: string
  fileSize: number
  fileSizeReadable: string
  extension: string
  uploadTime: number
}

/**
 * 合同库文件列表请求参数
 */
export interface ContractFileListRequest {
  pageNum: number
  pageSize: number
}

/**
 * 合同库文件列表响应
 */
export interface ContractFileListResponse {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  list: ContractFileItem[]
}

export interface DocumentTemplate {
  id: string
  name: string
  category: string
  description: string
}

/**
 * 合同风险审查 - 审核立场类型
 */
export type ReviewPosition = 'neutral' | 'partyA' | 'partyB'

/**
 * 合同风险审查 - 谈判地位类型
 */
export type NegotiationStatus = 'equal' | 'advantage' | 'disadvantage'

/**
 * 合同风险审查 - 风险等级类型
 */
export type RiskLevel = 'high' | 'medium' | 'low'

/**
 * 合同风险审查 - 文档概览
 */
export interface RiskReviewOverview {
  fileName: string
  fileSize: string
  contractType: string
  totalClauses: number
  riskCount: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
}

/**
 * 合同风险审查 - 风险项
 */
export interface RiskItem {
  id: number
  level: RiskLevel
  title: string
  description: string
  location: string
  suggestion: string
  relatedLaw: string
}

/**
 * 合同风险审查 - 响应体
 */
export interface ContractRiskReviewResponse {
  overview: RiskReviewOverview
  risks: RiskItem[]
  suggestions: string[]
  score: number
  level: string
}

/**
 * 合同风险审查 - 请求体
 */
export interface ContractRiskReviewRequest {
  file: File
  reviewPosition: ReviewPosition
  negotiationStatus: NegotiationStatus
  customRules: string
  question?: string
  sessionId?: string
}
