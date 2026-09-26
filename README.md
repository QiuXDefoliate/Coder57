# 澄心银行 AI Agent MVP

面向中国大陆个人用户的模拟银行 AI Agent。项目包含聊天工作台、账单分析、理财适当性、卡片管理、订阅识别、自动化任务和审计记录。所有资金及高风险动作都必须经过 `prepare → confirm → execute`。

## 快速开始

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

打开 <http://localhost:3000>。演示强认证码为 `123456`。默认 `DEMO_MODE=true`，不需要数据库、Redis 或 DeepSeek Key；配置 Key 后会启用 DeepSeek 意图路由，服务异常时自动回退到本地安全解析器。

如需修改浏览器访问的 API 地址，把 `NEXT_PUBLIC_API_URL` 写入 `apps/web/.env.local`；默认地址为 `http://localhost:4000/api`。

## 完整基础设施

```powershell
docker compose up -d
npm run db:generate
npm run db:migrate
npm run dev:worker
```

当前 MVP 的业务数据仍由可重置的演示存储提供，Prisma/PostgreSQL 模型与 BullMQ worker 已定义为下一步持久化适配边界。前端不会直接调用模型或修改账户余额。

## 内置演示

- “给张三转 200 元”
- “明天给李梅 13800138001 转 500 元”
- “昨晚聚餐 600 元，我不参与，张三李梅王强 AA”
- “分析本月异常交易”
- “为爱人生日预留 1000 元”

## 安全边界

- 这是模拟系统，不连接真实银行、证券、征信、日历或商户。
- 完整卡号、身份证号、密码和验证码禁止进入模型上下文。
- 模型只提议工具调用；后端负责权限、余额、限额、确认状态和幂等校验。
- 理财内容只作产品信息展示，不构成投资建议。
