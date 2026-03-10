import { useState, useCallback, useRef } from 'react'
import { Upload, AlertTriangle, Shield, CheckCircle, AlertCircle, Info, ChevronDown, Copy, Check, Settings } from 'lucide-react'
import { apiService } from '../services/api'
import type {
  ContractRiskReviewResponse,
  ReviewPosition,
  NegotiationStatus,
  RiskLevel
} from '../types/legal'

/**
 * ============================================================
 * 【数据模式切换标记】
 * USE_MOCK_DATA = true  -> 使用静态测试数据（开发调试用）
 * USE_MOCK_DATA = false -> 调用后端接口获取动态数据
 * ============================================================
 */
const USE_MOCK_DATA = false

/**
 * 静态测试数据 - 用于开发调试
 * 当 USE_MOCK_DATA = true 时使用此数据
 */
const MOCK_REVIEW_RESULT: ContractRiskReviewResponse = {
  overview: {
    fileName: '测试合同.docx',
    fileSize: '245.00',
    contractType: '买卖合同',
    totalClauses: 28,
    riskCount: 5,
    highRiskCount: 2,
    mediumRiskCount: 2,
    lowRiskCount: 1
  },
  risks: [
    {
      id: 1,
      level: 'high' as RiskLevel,
      title: '违约责任过于严苛',
      description: '合同第8条第3款约定的违约金比例过高，达到合同总金额的30%，超出司法实践中通常支持的比例范围。',
      location: '第8条第3款',
      suggestion: '建议将违约金比例调整为合同总金额的10%-20%，或明确约定违约金过高时可请求法院调整。',
      relatedLaw: '《民法典》第585条'
    },
    {
      id: 2,
      level: 'high' as RiskLevel,
      title: '保密期限未明确',
      description: '合同第12条仅约定了保密义务，但未明确保密期限，可能导致双方对保密义务终止时间产生争议。',
      location: '第12条',
      suggestion: '建议明确约定保密期限为合同终止后2-3年，或根据商业秘密的性质确定合理期限。',
      relatedLaw: '《民法典》第501条'
    },
    {
      id: 3,
      level: 'medium' as RiskLevel,
      title: '争议解决方式单一',
      description: '合同第15条仅约定了仲裁作为争议解决方式，未考虑诉讼作为备选方案，可能增加维权成本。',
      location: '第15条',
      suggestion: '建议约定为"可向合同签订地有管辖权的人民法院起诉"，或提供仲裁/诉讼双轨制选择。',
      relatedLaw: '《民事诉讼法》第24条'
    },
    {
      id: 4,
      level: 'medium' as RiskLevel,
      title: '质量标准不明确',
      description: '合同第5条对产品质量标准的描述过于笼统，仅约定"符合国家标准"，未明确具体标准编号。',
      location: '第5条第1款',
      suggestion: '建议明确具体的国家标准编号，如GB/T XXXX-XXXX，或约定详细的质量验收标准。',
      relatedLaw: '《民法典》第511条'
    },
    {
      id: 5,
      level: 'low' as RiskLevel,
      title: '通知方式不够完善',
      description: '合同第18条约定的通知方式仅包括书面形式，未涵盖电子邮件等现代通讯方式。',
      location: '第18条',
      suggestion: '建议增加电子邮件、即时通讯等现代通知方式，并明确各方指定的联系邮箱和联系人。',
      relatedLaw: '《民法典》第137条'
    }
  ],
  suggestions: [
    '建议在合同首部增加"签订地点"条款，便于确定管辖法院',
    '建议明确约定"合同生效条件"，如"双方签字盖章后生效"',
    '建议增加"不可抗力"条款的具体范围和免责条件',
    '建议明确"合同变更和解除"的程序和条件',
    '建议增加"知识产权"条款，明确合同履行过程中产生的知识产权归属'
  ],
  score: 72,
  level: '良好'
}

/**
 * 合同风险审查组件
 * 提供合同上传、风险审查和分析报告功能
 */
export function ContractRiskReview() {
  const [file, setFile] = useState<File | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewResult, setReviewResult] = useState<ContractRiskReviewResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [reviewPosition, setReviewPosition] = useState<ReviewPosition>('neutral')
  const [negotiationStatus, setNegotiationStatus] = useState<NegotiationStatus>('equal')
  const [customRules, setCustomRules] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * 处理文件上传
   */
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setReviewResult(null)
      setError(null)
    }
  }, [])

  /**
   * 使用静态测试数据进行审查
   */
  const handleMockReview = useCallback(() => {
    setTimeout(() => {
      setReviewResult({
        ...MOCK_REVIEW_RESULT,
        overview: {
          ...MOCK_REVIEW_RESULT.overview,
          fileName: file?.name || MOCK_REVIEW_RESULT.overview.fileName,
          fileSize: file ? (file.size / 1024).toFixed(2) : MOCK_REVIEW_RESULT.overview.fileSize
        }
      })
      setIsReviewing(false)
    }, 3000)
  }, [file])

  /**
   * 调用后端接口进行审查
   */
  const handleApiReview = useCallback(async () => {
    if (!file) return

    try {
      setError(null)
      const response = await apiService.contractRiskReview({
        file,
        reviewPosition,
        negotiationStatus,
        customRules,
        question: '给出具体的参考法律法规',
        sessionId: '1'
      })
      setReviewResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : '审查失败，请稍后重试')
      console.error('合同风险审查失败:', err)
    } finally {
      setIsReviewing(false)
    }
  }, [file, reviewPosition, negotiationStatus, customRules])

  /**
   * 开始风险审查
   * 根据 USE_MOCK_DATA 标记决定使用静态数据还是调用接口
   */
  const handleReview = useCallback(() => {
    if (!file) return

    setIsReviewing(true)
    setError(null)

    if (USE_MOCK_DATA) {
      handleMockReview()
    } else {
      handleApiReview()
    }
  }, [file, handleMockReview, handleApiReview])

  /**
   * 生成报告文本
   */
  const generateReportText = useCallback(() => {
    if (!reviewResult) return ''
    let text = `# 合同风险审查报告\n\n`
    text += `## 文档概览\n`
    text += `- 文件名称: ${reviewResult.overview.fileName}\n`
    text += `- 文件大小: ${reviewResult.overview.fileSize} KB\n`
    text += `- 合同类型: ${reviewResult.overview.contractType}\n`
    text += `- 总条款数: ${reviewResult.overview.totalClauses}\n`
    text += `- 风险总数: ${reviewResult.overview.riskCount}\n`
    text += `  - 高风险: ${reviewResult.overview.highRiskCount}\n`
    text += `  - 中风险: ${reviewResult.overview.mediumRiskCount}\n`
    text += `  - 低风险: ${reviewResult.overview.lowRiskCount}\n\n`
    text += `## 审查评分: ${reviewResult.score}分 (${reviewResult.level})\n\n`
    text += `## 风险详情\n\n`
    reviewResult.risks.forEach((risk) => {
      const levelText = risk.level === 'high' ? '高' : risk.level === 'medium' ? '中' : '低'
      text += `### ${levelText}风险 - ${risk.title}\n`
      text += `- 位置: ${risk.location}\n`
      text += `- 描述: ${risk.description}\n`
      text += `- 建议: ${risk.suggestion}\n`
      text += `- 相关法律: ${risk.relatedLaw}\n\n`
    })
    text += `## 修改建议\n\n`
    reviewResult.suggestions.forEach((suggestion, index) => {
      text += `${index + 1}. ${suggestion}\n`
    })
    return text
  }, [reviewResult])

  /**
   * 复制审查报告
   */
  const handleCopyReport = useCallback(() => {
    if (reviewResult) {
      const report = generateReportText()
      navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [reviewResult, generateReportText])

  /**
   * 获取风险级别图标
   */
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'low':
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  /**
   * 获取风险级别颜色
   */
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* 顶部标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">合同风险审查</h1>
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-4"> CONTRACT RISK REVIEW</p>
          <p className="text-gray-600">覆盖200+类合同风险审查，超过3000风险审查点</p>
          {/* 数据模式提示 */}
          {USE_MOCK_DATA && (
            <p className="mt-2 text-xs text-orange-500 bg-orange-50 inline-block px-3 py-1 rounded-full">
              当前使用静态测试数据
            </p>
          )}
        </div>

        {!reviewResult ? (
          /* 主配置区域 */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            {/* 上传区域 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all mb-8"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">点击或拖拽上传合同</h3>
              <p className="text-gray-400 text-sm">支持 .xlsx .docx .pdf .txt 格式</p>
              {file && (
                <div className="mt-4 text-sm text-blue-600 font-medium">
                  已选择: {file.name}
                </div>
              )}
            </div>

            {/* 配置选项 */}
            <div className="space-y-6">
              {/* 审核立场和谈判地位 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">审核立场</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'neutral', label: '中立' },
                      { value: 'partyA', label: '甲方' },
                      { value: 'partyB', label: '乙方' }
                    ].map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => setReviewPosition(pos.value as ReviewPosition)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          reviewPosition === pos.value
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">谈判地位</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <span>
                        {negotiationStatus === 'equal' ? '平等地位' : negotiationStatus === 'advantage' ? '优势地位' : '弱势地位'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                        <button
                          onClick={() => {
                            setNegotiationStatus('equal')
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors ${
                            negotiationStatus === 'equal' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          平等地位
                        </button>
                        <button
                          onClick={() => {
                            setNegotiationStatus('advantage')
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors ${
                            negotiationStatus === 'advantage' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          优势地位
                        </button>
                        <button
                          onClick={() => {
                            setNegotiationStatus('disadvantage')
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors ${
                            negotiationStatus === 'disadvantage' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          弱势地位
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 自定义审查规则 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  高级：自定义审查规则
                </label>
                <textarea
                  value={customRules}
                  onChange={(e) => setCustomRules(e.target.value)}
                  placeholder="输入特定审查规则，例如：重点关注赔偿限额..."
                  className="w-full px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 底部特性 */}
            <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                安全保密
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                即时分析
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                专业批注
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                风险识别
              </div>
            </div>

            {/* 开始审查按钮 */}
            <div className="mt-8">
              {isReviewing ? (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">正在审查合同...</p>
                </div>
              ) : (
                <button
                  onClick={handleReview}
                  disabled={!file}
                  className={`w-full px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    file
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  开始风险审查
                </button>
              )}
            </div>
          </div>
        ) : (
          /* 审查结果区域 */
          <div className="space-y-6">
            {/* 顶部评分卡片 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-3xl font-bold text-blue-600">{reviewResult.score}</span>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                      {reviewResult.level}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{reviewResult.overview.contractType}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>总条款: {reviewResult.overview.totalClauses}</span>
                      <span className="text-red-600 font-medium">高风险: {reviewResult.overview.highRiskCount}</span>
                      <span className="text-yellow-600 font-medium">中风险: {reviewResult.overview.mediumRiskCount}</span>
                      <span className="text-blue-600 font-medium">低风险: {reviewResult.overview.lowRiskCount}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCopyReport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? '已复制' : '复制报告'}
                  </button>
                  <button
                    onClick={() => {
                      setFile(null)
                      setReviewResult(null)
                      setError(null)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    重新审查
                  </button>
                </div>
              </div>
            </div>

            {/* 风险列表 */}
            <div className="space-y-4">
              {reviewResult.risks.map((risk) => (
                <div
                  key={risk.id}
                  className={`bg-white rounded-2xl shadow-lg border-2 ${getRiskColor(risk.level)} p-6`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getRiskIcon(risk.level)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h4 className="font-semibold text-gray-800">{risk.title}</h4>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                          {risk.location}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3 text-sm">{risk.description}</p>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-gray-800">修改建议</span>
                        </div>
                        <p className="text-sm text-gray-700 ml-6">{risk.suggestion}</p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {risk.relatedLaw}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 整体建议 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                整体优化建议
              </h4>
              <ul className="space-y-2">
                {reviewResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {/* 底部免责声明 */}
            <div className="text-center text-xs text-gray-400 mt-8">
              审查结果仅供参考，重要合同请咨询专业律师
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
