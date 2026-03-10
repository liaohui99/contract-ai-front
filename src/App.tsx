import { useState } from 'react'
import { Menu, LayoutGrid, FileText, Search, BookOpen, Folder, ChevronLeft, Shield, MessageSquare, HelpCircle } from 'lucide-react'
import { SmartChat } from './components/SmartChat'
import { DocumentGenerator } from './components/DocumentGenerator'
import { LegalSearch } from './components/LegalSearch'
import { TextReader } from './components/TextReader'
import { ContractLibrary } from './components/ContractLibrary'
import { ContractRiskReview } from './components/ContractRiskReview'
import type { LegalTab } from './types/legal'
import { cn } from './lib/utils'

/**
 * 主应用组件
 * 轮动法律顾问系统主界面
 */
export function App() {
  const [activeTab, setActiveTab] = useState<LegalTab>('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const tabs: { id: LegalTab; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: '智能对话', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'document', label: '文书生成', icon: <FileText className="w-5 h-5" /> },
    { id: 'search', label: '法律检索', icon: <Search className="w-5 h-5" /> },
    { id: 'contracts', label: '合同库', icon: <Folder className="w-5 h-5" /> },
    { id: 'risk-review', label: '合同风险审查', icon: <Shield className="w-5 h-5" /> },
    { id: 'reader', label: '文本阅读', icon: <BookOpen className="w-5 h-5" /> },
  ]

  return (
    <div className="flex h-[125vh] bg-gray-50 overflow-hidden" style={{ zoom: 0.8 }}>
      {/* 左侧边栏 */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo 区域 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img src="/src/assets/law_agent_icon.png" alt="法律顾问" className="w-10 h-10 rounded-xl shadow-lg" />
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-gray-800">法律顾问</h1>
              </div>
            )}
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {tab.icon}
              {sidebarOpen && <span className="font-medium">{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* 底部菜单 */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">
            <LayoutGrid className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">指令集</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">
            <HelpCircle className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">帮助</span>}
          </button>
        </div>

        {/* 切换侧边栏按钮 */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", !sidebarOpen && "rotate-180")} />
            {sidebarOpen && <span className="text-sm">收起</span>}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 顶部栏 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium">
                <LayoutGrid className="w-4 h-4" />
                指令集
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium">
                <HelpCircle className="w-4 h-4" />
                帮助
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium">
                反馈
              </button>
            </div>
          </div>
        </header>

        {/* 功能内容区 - 使用 CSS 隐藏保持组件状态 */}
        <div className="flex-1 overflow-hidden relative">
          <div className={cn(
            "absolute inset-0 overflow-hidden",
            activeTab !== 'chat' && "hidden"
          )}>
            <SmartChat />
          </div>
          <div className={cn(
            "absolute inset-0 overflow-hidden",
            activeTab !== 'document' && "hidden"
          )}>
            <DocumentGenerator />
          </div>
          <div className={cn(
            "absolute inset-0 overflow-hidden",
            activeTab !== 'search' && "hidden"
          )}>
            <LegalSearch />
          </div>
          <div className={cn(
            "absolute inset-0 overflow-hidden",
            activeTab !== 'contracts' && "hidden"
          )}>
            <ContractLibrary />
          </div>
          <div className={cn(
            "absolute inset-0 overflow-hidden",
            activeTab !== 'risk-review' && "hidden"
          )}>
            <ContractRiskReview />
          </div>
          <div className={cn(
            "absolute inset-0 overflow-hidden",
            activeTab !== 'reader' && "hidden"
          )}>
            <TextReader />
          </div>
        </div>
      </main>
    </div>
  )
}
