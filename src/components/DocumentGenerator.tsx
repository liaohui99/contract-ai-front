import { useState, useCallback } from 'react'
import { FileText, Sparkles, Wand2, Download, Copy, Check } from 'lucide-react'
import type { DocumentTemplate } from '../types/legal'

/**
 * 文书生成组件
 * 提供法律文书模板选择和生成功能
 */
export function DocumentGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const templates: DocumentTemplate[] = [
    {
      id: '1',
      name: '民事起诉状',
      category: '诉讼文书',
      description: '用于向法院提起民事诉讼的法律文书'
    },
    {
      id: '2',
      name: '劳动合同',
      category: '合同模板',
      description: '规范用人单位与劳动者之间劳动关系的合同'
    },
    {
      id: '3',
      name: '授权委托书',
      category: '委托文书',
      description: '授权他人代表自己进行特定法律行为的文书'
    },
    {
      id: '4',
      name: '借条',
      category: '借贷文书',
      description: '证明借款事实存在的书面凭证'
    },
    {
      id: '5',
      name: '离婚协议书',
      category: '婚姻家庭',
      description: '夫妻双方自愿离婚时就相关事项达成的协议'
    },
    {
      id: '6',
      name: '遗嘱',
      category: '继承文书',
      description: '生前对个人财产进行处分的法律文书'
    }
  ]

  const [formData, setFormData] = useState({
    plaintiff: '',
    defendant: '',
    claim: '',
    facts: ''
  })

  /**
   * 选择模板
   */
  const handleSelectTemplate = useCallback((templateId: string) => {
    setSelectedTemplate(templateId)
    setGeneratedContent(null)
  }, [])

  /**
   * 生成文书
   */
  const handleGenerate = useCallback(() => {
    setIsGenerating(true)
    setTimeout(() => {
      const template = templates.find(t => t.id === selectedTemplate)
      setGeneratedContent(`
# ${template?.name || '法律文书'}

## 原告信息
姓名：${formData.plaintiff || '[原告姓名]'}
性别：[性别]
民族：[民族]
出生日期：[日期]
住址：[详细住址]
联系电话：[联系电话]

## 被告信息
姓名：${formData.defendant || '[被告姓名]'}
性别：[性别]
民族：[民族]
出生日期：[日期]
住址：[详细住址]
联系电话：[联系电话]

## 诉讼请求
${formData.claim || '[请详细描述您的诉讼请求]'}

## 事实与理由
${formData.facts || '[请详细陈述案件事实和理由]'}

此致
[具体法院名称]

具状人：[签名]
日期：[日期]
      `.trim())
      setIsGenerating(false)
    }, 2000)
  }, [selectedTemplate, formData, templates])

  /**
   * 复制内容
   */
  const handleCopy = useCallback(() => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [generatedContent])

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            文书生成
          </h1>
          <p className="text-gray-600">选择模板，智能生成专业法律文书</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：模板选择和表单 */}
          <div className="space-y-6">
            {/* 模板选择 */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                选择模板
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-800 mb-1">{template.name}</div>
                    <div className="text-xs text-gray-500">{template.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 表单输入 */}
            {selectedTemplate && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">填写信息</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">原告/申请人</label>
                    <input
                      type="text"
                      value={formData.plaintiff}
                      onChange={(e) => setFormData({ ...formData, plaintiff: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      placeholder="请输入原告姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">被告/被申请人</label>
                    <input
                      type="text"
                      value={formData.defendant}
                      onChange={(e) => setFormData({ ...formData, defendant: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      placeholder="请输入被告姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">诉讼请求</label>
                    <textarea
                      value={formData.claim}
                      onChange={(e) => setFormData({ ...formData, claim: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                      rows={3}
                      placeholder="请描述您的诉讼请求"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">事实与理由</label>
                    <textarea
                      value={formData.facts}
                      onChange={(e) => setFormData({ ...formData, facts: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                      rows={4}
                      placeholder="请详细陈述案件事实"
                    />
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        智能生成
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：生成结果 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">生成预览</h2>
              {generatedContent && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                    title="复制"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                    title="下载"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-6 min-h-[500px]">
              {generatedContent ? (
                <div className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed">
                  {generatedContent}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p>选择模板并填写信息后，点击"智能生成"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
