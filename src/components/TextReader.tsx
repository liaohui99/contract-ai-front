import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, Highlighter, Copy, Check, Volume2, Pause, Download, Building2, User, DollarSign, Package, Truck, Shield, AlertTriangle, FileCheck, RefreshCw } from 'lucide-react'
import { apiService } from '../services/api'
import type { ContractResp, ContractParty } from '../types/legal'

/**
 * 格式化当事方信息
 */
function formatParty(party: ContractParty): string {
  let text = ''
  text += `单位名称：${party.name || '未填写'}\n`
  text += `法定代表人：${party.legalRepresentative || '未填写'}\n`
  text += `委托代表人：${party.authorizedRepresentative || '未填写'}\n`
  text += `电话：${party.phone || '未填写'}\n`
  text += `传真：${party.fax || '未填写'}\n`
  text += `开户行：${party.bank || '未填写'}\n`
  text += `账号：${party.account || '未填写'}\n\n`
  return text
}

/**
 * 格式化合同数据为文本
 */
function formatContractToText(data: ContractResp): string {
  let text = '═══════════════════════════════════════\n'
  text += '           合同解析报告\n'
  text += '═══════════════════════════════════════\n\n'
  
  text += '【基本信息】\n'
  text += `合同编号：${data.contractNo || '未填写'}\n`
  text += `签订地点：${data.signPlace || '未填写'}\n`
  text += `签订时间：${data.signDate || '未填写'}\n\n`
  
  if (data.partyA) {
    text += '【甲方信息】\n'
    text += formatParty(data.partyA)
  }
  
  if (data.partyB) {
    text += '【乙方信息】\n'
    text += formatParty(data.partyB)
  }
  
  if (data.items && data.items.length > 0) {
    text += '【采购清单】\n'
    data.items.forEach((item, index) => {
      text += `\n${index + 1}. ${item.productName || '未命名'}\n`
      text += `   规格型号：${item.specification || '-'}\n`
      text += `   数量：${item.quantity || 0} ${item.unit || ''}\n`
      text += `   单价：${item.unitPrice ? `¥${item.unitPrice}` : '-'}\n`
      text += `   金额：${item.amount ? `¥${item.amount}` : '-'}\n`
    })
  }
  
  text += '\n【金额信息】\n'
  text += `总金额（小写）：${data.totalAmount ? `¥${data.totalAmount}` : '未填写'}\n`
  text += `总金额（大写）：${data.totalAmountInWords || '未填写'}\n\n`
  
  text += '【交付信息】\n'
  text += `交货时间：${data.deliveryTime || '未填写'}\n`
  text += `交货地点：${data.deliveryPlace || '未填写'}\n\n`
  
  text += '【条款详情】\n'
  text += `技术标准/质量要求：${data.technicalStandard || '未填写'}\n`
  text += `运费及费用承担：${data.freightTerms || '未填写'}\n`
  text += `结算及支付方式：${data.paymentTerms || '未填写'}\n`
  text += `违约责任：${data.penaltyClause || '未填写'}\n`
  text += `争议解决方式：${data.disputeResolution || '未填写'}\n`
  text += `其他约定：${data.otherProvisions || '未填写'}\n`
  text += `签（公）证信息：${data.notarizationInfo || '未填写'}\n`
  
  return text
}

/**
 * 文本阅读组件
 * 提供文档上传、阅读和智能解析功能
 */
export function TextReader() {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ContractResp | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * 处理文件上传
   */
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setAnalysisResult(null)
      setError(null)
    }
  }, [])

  /**
   * 开始分析 - 调用后端接口
   */
  const handleAnalyze = useCallback(async () => {
    if (!file) return

    setIsAnalyzing(true)
    setError(null)
    
    try {
      const result = await apiService.parseFile(file)
      setAnalysisResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败，请重试')
    } finally {
      setIsAnalyzing(false)
    }
  }, [file])

  /**
   * 复制内容
   */
  const handleCopy = useCallback(() => {
    if (analysisResult) {
      const text = formatContractToText(analysisResult)
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [analysisResult])

  /**
   * 下载报告
   */
  const handleDownload = useCallback(() => {
    if (!analysisResult || !file) return
    
    const text = formatContractToText(analysisResult)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `合同解析报告_${file.name}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [analysisResult, file])

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            文本阅读
          </h1>
          <p className="text-gray-600">上传文档，智能解析关键信息</p>
        </div>

        {!file ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">上传文档</h3>
              <p className="text-gray-600 mb-6">点击或拖拽文件到此处</p>
              <p className="text-sm text-gray-400">支持 PDF、Word、Excel、PPT、TXT 格式，最大 10MB</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-800 truncate max-w-xs">{file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title={isPlaying ? '暂停朗读' : '开始朗读'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 text-gray-600" /> : <Volume2 className="w-5 h-5 text-gray-600" />}
                  </button>
                  <button
                    onClick={() => {
                      setFile(null)
                      setAnalysisResult(null)
                      setError(null)
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                    title="重新上传"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 min-h-[400px]">
                <div className="bg-gray-50 rounded-xl p-6 text-gray-600">
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>文档内容预览</p>
                      <p className="text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Highlighter className="w-5 h-5" />
                  智能解析
                </h2>
                {analysisResult && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                      title="复制"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                      title="下载报告"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
                {!analysisResult ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    {isAnalyzing ? (
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">正在分析文档...</p>
                        <p className="text-gray-400 text-sm mt-1">请稍候，这可能需要几秒钟</p>
                      </div>
                    ) : error ? (
                      <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 font-medium mb-2">解析失败</p>
                        <p className="text-gray-500 text-sm mb-4">{error}</p>
                        <button
                          onClick={handleAnalyze}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          重试
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAnalyze}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        <Highlighter className="w-5 h-5" />
                        开始智能解析
                      </button>
                    )}
                  </div>
                ) : (
                  <ContractResultView data={analysisResult} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 合同解析结果展示组件
 */
function ContractResultView({ data }: { data: ContractResp }) {
  return (
    <div className="space-y-6">
      <Section title="基本信息" icon={<FileCheck className="w-5 h-5 text-blue-600" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoItem label="合同编号" value={data.contractNo} />
          <InfoItem label="签订地点" value={data.signPlace} />
          <InfoItem label="签订时间" value={data.signDate} />
        </div>
      </Section>

      {data.partyA && (
        <Section title="甲方信息" icon={<Building2 className="w-5 h-5 text-green-600" />}>
          <PartyView party={data.partyA} />
        </Section>
      )}

      {data.partyB && (
        <Section title="乙方信息" icon={<User className="w-5 h-5 text-purple-600" />}>
          <PartyView party={data.partyB} />
        </Section>
      )}

      {data.items && data.items.length > 0 && (
        <Section title="采购清单" icon={<Package className="w-5 h-5 text-orange-600" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-medium text-gray-600">品名</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">规格型号</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">数量</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">单位</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">单价</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600">金额</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="px-4 py-2 text-gray-800">{item.productName || '-'}</td>
                    <td className="px-4 py-2 text-gray-600">{item.specification || '-'}</td>
                    <td className="px-4 py-2 text-right text-gray-800">{item.quantity || 0}</td>
                    <td className="px-4 py-2 text-gray-600">{item.unit || '-'}</td>
                    <td className="px-4 py-2 text-right text-gray-800">{item.unitPrice ? `¥${item.unitPrice}` : '-'}</td>
                    <td className="px-4 py-2 text-right text-gray-800 font-medium">{item.amount ? `¥${item.amount}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="金额信息" icon={<DollarSign className="w-5 h-5 text-emerald-600" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="总金额（小写）" value={data.totalAmount ? `¥${data.totalAmount.toLocaleString()}` : undefined} highlight />
          <InfoItem label="总金额（大写）" value={data.totalAmountInWords} highlight />
        </div>
      </Section>

      <Section title="交付信息" icon={<Truck className="w-5 h-5 text-cyan-600" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="交货时间" value={data.deliveryTime} />
          <InfoItem label="交货地点" value={data.deliveryPlace} />
        </div>
      </Section>

      <Section title="条款详情" icon={<Shield className="w-5 h-5 text-indigo-600" />}>
        <div className="space-y-4">
          <InfoItem label="技术标准/质量要求" value={data.technicalStandard} fullWidth />
          <InfoItem label="运费及费用承担" value={data.freightTerms} fullWidth />
          <InfoItem label="结算及支付方式" value={data.paymentTerms} fullWidth />
          <InfoItem label="违约责任" value={data.penaltyClause} fullWidth />
          <InfoItem label="争议解决方式" value={data.disputeResolution} fullWidth />
          <InfoItem label="其他约定" value={data.otherProvisions} fullWidth />
          <InfoItem label="签（公）证信息" value={data.notarizationInfo} fullWidth />
        </div>
      </Section>
    </div>
  )
}

/**
 * 当事方信息展示组件
 */
function PartyView({ party }: { party: ContractParty }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InfoItem label="单位名称" value={party.name} />
      <InfoItem label="法定代表人" value={party.legalRepresentative} />
      <InfoItem label="委托代表人" value={party.authorizedRepresentative} />
      <InfoItem label="电话" value={party.phone} />
      <InfoItem label="传真" value={party.fax} />
      <InfoItem label="开户行" value={party.bank} />
      <InfoItem label="账号" value={party.account} />
    </div>
  )
}

/**
 * 信息项组件
 */
function InfoItem({ 
  label, 
  value, 
  highlight = false, 
  fullWidth = false 
}: { 
  label: string
  value?: string | number
  highlight?: boolean
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'text-lg font-semibold text-blue-600' : 'text-gray-800'}`}>
        {value || <span className="text-gray-400">未填写</span>}
      </p>
    </div>
  )
}

/**
 * 分组标题组件
 */
function Section({ 
  title, 
  icon, 
  children 
}: { 
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}
