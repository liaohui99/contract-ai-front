# AI Agent 前端项目

一个基于 React + TypeScript + Vite 的现代化前端应用，用于与后端 AI Agent 智能体进行对话交互。

## 🚀 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 8
- **样式**: Tailwind CSS v4
- **HTTP客户端**: Axios
- **图标**: Lucide React

## 📦 已安装的 Skills

### 设计系统与UI组件
- ✅ `tailwind-design-system` - Tailwind设计系统（13.7K安装量）
- ✅ `heroui-react` - HeroUI React组件库
- ✅ `tailwindcss-advanced-layouts` - 高级布局技巧
- ✅ `tailwind-css-patterns` - CSS模式库
- ✅ `tailwindcss-animations` - 动画效果

### React最佳实践
- ✅ `vercel-react-best-practices` - Vercel React最佳实践（188.5K安装量）
- ✅ `react-ui-patterns` - React UI模式集合
- ✅ `frontend-patterns` - 前端开发模式

### 需求分析与快速原型
- ✅ `requirements-analysis` - 需求分析工具
- ✅ `requirements-clarity` - 需求清晰度检查
- ✅ `rapid-prototyper` - 快速原型设计
- ✅ `chat-ui` - 聊天UI组件

### TypeScript支持
- ✅ `typescript-advanced-types` - TypeScript高级类型

## 🎯 项目特性

- 🎨 美观的聊天UI界面
- 💬 实时消息发送与接收
- 📱 响应式设计，支持移动端
- 🔄 流式消息支持
- 🎭 会话管理
- ⚡ 快速热更新开发体验
- 🛡️ TypeScript类型安全

## 📁 项目结构

```
taorunhui-ai-front/
├── src/
│   ├── components/          # React组件
│   │   └── ChatUI.tsx      # 聊天UI组件
│   ├── services/           # API服务
│   │   └── api.ts          # API客户端
│   ├── types/              # TypeScript类型定义
│   │   └── chat.ts         # 聊天相关类型
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── .env                    # 环境变量
├── vite.config.ts          # Vite配置
└── package.json            # 项目依赖
```

## 🛠️ 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## ⚙️ 配置说明

### 环境变量

在 `.env` 文件中配置后端API地址：

```env
VITE_API_BASE_URL=http://localhost:8000
```

### API接口要求

后端API需要提供以下接口：

1. **发送消息**
   - POST `/api/chat`
   - 请求体: `{ message: string, conversationId?: string, history?: ChatMessage[] }`
   - 响应: `{ id: string, content: string, conversationId: string, timestamp: Date }`

2. **流式消息**（可选）
   - POST `/api/chat/stream`
   - 返回 Server-Sent Events 流

3. **获取Agent状态**
   - GET `/api/agents/status`
   - 响应: `AgentStatus[]`

4. **健康检查**
   - GET `/health`

## 🎨 UI组件说明

### ChatInput
聊天输入组件，支持多行输入和快捷键发送（Enter发送，Shift+Enter换行）

### MessageBubble
消息气泡组件，区分用户消息和AI助手消息

### ChatContainer
聊天容器组件，自动滚动到最新消息，支持加载状态显示

## 📝 开发建议

1. **类型安全**: 所有组件和函数都使用TypeScript类型定义
2. **组件化**: UI组件高度可复用
3. **错误处理**: 完善的错误处理和用户提示
4. **性能优化**: 使用React Hooks优化性能
5. **响应式设计**: 支持桌面和移动设备

## 🔧 后续优化建议

1. 添加用户认证功能
2. 实现会话历史持久化
3. 添加Markdown渲染支持
4. 实现代码高亮显示
5. 添加文件上传功能
6. 实现多语言支持
7. 添加深色模式

## 📄 License

MIT
