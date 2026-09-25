"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatResponse, DashboardData, PendingOperation, Transaction } from "@bank-agent/contracts";
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, Bell, Bot, CalendarClock, Check,
  ChevronRight, CircleDollarSign, CreditCard, FileClock, Home, Landmark, Loader2, LockKeyhole,
  Menu, MessageCircle, Mic, PieChart, Search, Send, Settings2, ShieldCheck, Sparkles, Split,
  Subtitles, UserRound, WalletCards, X, Zap
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
type Section = "home" | "chat" | "bills" | "wealth" | "cards" | "subscriptions" | "automations" | "audit";
type Message = { id: string; role: "assistant" | "user"; text: string; operation?: PendingOperation; suggestions?: string[] };

const nav: Array<{ id: Section; label: string; icon: typeof Home }> = [
  { id: "home", label: "账户总览", icon: Home },
  { id: "chat", label: "AI 助理", icon: MessageCircle },
  { id: "bills", label: "账单分析", icon: BarChart3 },
  { id: "wealth", label: "理财中心", icon: CircleDollarSign },
  { id: "cards", label: "卡片管理", icon: CreditCard },
  { id: "subscriptions", label: "订阅管理", icon: Subtitles },
  { id: "automations", label: "自动化", icon: Zap },
  { id: "audit", label: "安全审计", icon: ShieldCheck },
];

export default function BankAgent() {
  const [section, setSection] = useState<Section>("home");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [messages, setMessages] = useState<Message[]>([{ id: "hello", role: "assistant", text: "下午好，林晓。我是澄心 AI 助理。今天想处理转账、查看账单，还是管理订阅？", suggestions: ["给李梅转500元", "分析本月异常交易", "为爱人生日预留1000元"] }]);
  const [activeOperation, setActiveOperation] = useState<PendingOperation | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const refresh = useCallback(async () => {
    try { const res = await fetch(`${API}/dashboard`); if (res.ok) setDashboard(await res.json()); } catch { /* banner handles empty data */ }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setSection("chat");
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const data: ChatResponse | { message: string } = await res.json();
      if (!res.ok) throw new Error(data.message || "请求失败");
      const response = data as ChatResponse;
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", text: response.message, operation: response.operation, suggestions: response.suggestions }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", text: error instanceof Error ? `暂时无法连接服务：${error.message}` : "暂时无法连接服务。" }]);
    } finally { setLoading(false); }
  };

  return (
    <main className="shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Landmark size={22}/></div><div><strong>澄心</strong><span>CHENGXIN BANK</span></div></div>
        <button className="close-mobile" onClick={() => setMobileNav(false)} aria-label="关闭导航"><X/></button>
        <nav>{nav.map(item => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => { setSection(item.id); setMobileNav(false); }}><item.icon size={19}/><span>{item.label}</span>{item.id === "chat" && <i>AI</i>}</button>)}</nav>
        <div className="sidebar-card"><ShieldCheck size={22}/><strong>演示安全模式</strong><p>资金操作需确认与强认证，不连接真实银行账户。</p></div>
        <div className="user-row"><div className="avatar">林</div><div><strong>林晓</strong><span>个人账户</span></div><Settings2 size={18}/></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMobileNav(true)}><Menu/></button>
          <div className="crumb"><span>个人银行</span><ChevronRight size={14}/><strong>{nav.find(n => n.id === section)?.label}</strong></div>
          <div className="top-actions"><button><Search size={19}/></button><button className="notification"><Bell size={19}/><i/></button><div className="secure"><LockKeyhole size={15}/> 安全会话</div></div>
        </header>
        <div className="content">
          {section === "home" && <Dashboard data={dashboard} onNavigate={setSection} onPrompt={sendMessage}/>} 
          {section === "chat" && <ChatPanel messages={messages} loading={loading} onSend={sendMessage} onOperation={setActiveOperation}/>} 
          {section === "bills" && <BillsPage data={dashboard} onPrompt={sendMessage}/>} 
          {section === "wealth" && <WealthPage onPrompt={sendMessage}/>} 
          {section === "cards" && <CardsPage onPrompt={sendMessage}/>} 
          {section === "subscriptions" && <SubscriptionsPage onOperation={setActiveOperation}/>} 
          {section === "automations" && <AutomationsPage onPrompt={sendMessage}/>} 
          {section === "audit" && <AuditPage/>}
        </div>
      </section>
      {activeOperation && <OperationModal operation={activeOperation} onClose={() => setActiveOperation(null)} onDone={() => { setActiveOperation(null); refresh(); }}/>} 
    </main>
  );
}

function Dashboard({ data, onNavigate, onPrompt }: { data: DashboardData | null; onNavigate: (s: Section) => void; onPrompt: (s: string) => void }) {
  const account = data?.accounts[0];
  return <div className="page fade-in">
    <div className="hero-head"><div><span className="eyebrow">2026 年 9 月 24 日 · 星期四</span><h1>{data?.user.greeting ?? "你好"}，{data?.user.name ?? "林晓"}</h1><p>财务状态稳定，有一笔交易建议你核对。</p></div><button className="primary" onClick={() => onNavigate("chat")}><Sparkles size={18}/> 问问 AI 助理</button></div>
    {!data && <div className="offline-note"><Loader2 className="spin" size={18}/> 正在连接本地 API，请确认 API 已在 4000 端口启动。</div>}
    <div className="metric-grid">
      <div className="balance-card dark"><div className="card-top"><span>总资产</span><WalletCards size={21}/></div><strong>¥ {(data?.accounts.reduce((s,a)=>s+a.balance,0) ?? 40640.52).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</strong><small>较上月 <b>+4.2%</b></small><div className="account-line"><span>活期 ·· {account?.last4 ?? "8821"}</span><span>可用 ¥ {(account?.available ?? 27640.52).toLocaleString()}</span></div></div>
      <Metric title="本月收入" value={`¥ ${(data?.monthlyIncome ?? 18500).toLocaleString()}`} change="较上月 +3.1%" positive icon={<ArrowDownLeft/>}/>
      <Metric title="本月支出" value={`¥ ${(data?.monthlySpend ?? 10616).toLocaleString()}`} change="较上月 +8.4%" icon={<ArrowUpRight/>}/>
      <Metric title="自动扣费" value={`¥ ${(data?.subscriptionTotal ?? 58).toFixed(2)}`} change="3 项活跃订阅" icon={<CalendarClock/>}/>
    </div>
    <div className="two-col">
      <div className="panel spending"><PanelTitle title="本月支出分布" action="查看账单" onAction={() => onNavigate("bills")}/><SpendChart items={data?.categoryBreakdown ?? []}/></div>
      <div className="panel attention"><PanelTitle title="需要关注" action="全部提醒"/><div className="alert-item"><div className="alert-icon"><ShieldCheck/></div><div><strong>疑似异常交易</strong><p>环球数码港 · ¥4,299.00 · 深圳</p><small>凌晨大额、非常用城市</small></div><button onClick={() => onPrompt("分析本月异常交易")}>核对</button></div><div className="alert-item neutral"><div className="alert-icon"><CalendarClock/></div><div><strong>视频会员即将续费</strong><p>10 月 8 日 · ¥25.00</p><small>连续订阅 8 个月</small></div><button onClick={() => onNavigate("subscriptions")}>管理</button></div></div>
    </div>
    <div className="two-col lower">
      <div className="panel"><PanelTitle title="最近交易" action="查看全部" onAction={() => onNavigate("bills")}/><TransactionList items={data?.recentTransactions ?? []}/></div>
      <div className="panel quick"><PanelTitle title="快捷操作"/><div className="quick-grid"><Quick icon={<ArrowUpRight/>} label="转账" onClick={() => onPrompt("给李梅转500元")}/><Quick icon={<Split/>} label="AA 收款" onClick={() => onPrompt("聚餐600元，我不参与，张三李梅王强AA")}/><Quick icon={<PieChart/>} label="账单分析" onClick={() => onPrompt("分析本月账单")}/><Quick icon={<CreditCard/>} label="卡片管理" onClick={() => onNavigate("cards")}/></div></div>
    </div>
  </div>;
}

function Metric({ title, value, change, positive, icon }: { title: string; value: string; change: string; positive?: boolean; icon: React.ReactNode }) { return <div className="metric"><div className="metric-icon">{icon}</div><span>{title}</span><strong>{value}</strong><small className={positive ? "positive" : ""}>{change}</small></div>; }
function PanelTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) { return <div className="panel-title"><h3>{title}</h3>{action && <button onClick={onAction}>{action}<ChevronRight size={15}/></button>}</div>; }
function Quick({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick}><span>{icon}</span><strong>{label}</strong><ArrowRight size={15}/></button>; }

function SpendChart({ items }: { items: Array<{ category: string; amount: number; color: string }> }) {
  const fallback = [{category:"住房",amount:5200,color:"#ef9164"},{category:"购物",amount:4625,color:"#7764e4"},{category:"餐饮",amount:727,color:"#37b494"},{category:"交通",amount:49,color:"#4b91e6"}];
  const source = items.length ? items.slice(0,5) : fallback; const total = source.reduce((s,x)=>s+x.amount,0);
  let cursor = 0; const gradient = source.map(x => { const start=cursor; cursor += x.amount/total*100; return `${x.color} ${start}% ${cursor}%`; }).join(",");
  return <div className="chart-wrap"><div className="donut" style={{ background: `conic-gradient(${gradient})` }}><div><small>本月支出</small><strong>¥{total.toLocaleString("zh-CN",{maximumFractionDigits:0})}</strong></div></div><div className="legend">{source.map(x=><div key={x.category}><i style={{background:x.color}}/><span>{x.category}</span><strong>¥{x.amount.toLocaleString()}</strong><small>{Math.round(x.amount/total*100)}%</small></div>)}</div></div>;
}

function TransactionList({ items }: { items: Transaction[] }) { const fallback: Transaction[] = [{id:"1",merchant:"盒马鲜生",amount:326.4,direction:"debit",category:"购物",confidence:.96,date:"今天 18:42",location:"上海"},{id:"2",merchant:"滴滴出行",amount:48.6,direction:"debit",category:"交通",confidence:.99,date:"今天 08:16",location:"上海"},{id:"3",merchant:"工资",amount:18500,direction:"credit",category:"收入",confidence:1,date:"9月5日",location:"上海"}]; return <div className="tx-list">{(items.length?items:fallback).slice(0,4).map(t=><div key={t.id}><div className={`tx-icon ${t.direction}`} >{t.direction === "credit" ? <ArrowDownLeft/> : <ArrowUpRight/>}</div><div><strong>{t.merchant}</strong><span>{typeof t.date === "string" && t.date.includes("T") ? new Date(t.date).toLocaleDateString("zh-CN",{month:"short",day:"numeric"}) : t.date} · {t.category}</span></div><b className={t.direction}>{t.direction === "credit" ? "+" : "−"} ¥{t.amount.toLocaleString()}</b></div>)}</div>; }

function ChatPanel({ messages, loading, onSend, onOperation }: { messages: Message[]; loading: boolean; onSend: (s:string)=>void; onOperation:(o:PendingOperation)=>void }) {
  const [input,setInput]=useState(""); const [listening,setListening]=useState(false); const end=useRef<HTMLDivElement>(null);
  useEffect(()=>end.current?.scrollIntoView({behavior:"smooth"}),[messages,loading]);
  const submit=()=>{if(input.trim()){onSend(input);setInput("");}};
  const voice=()=>{ const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if(!SpeechRecognition){setInput("给李梅转500元");return;} const rec=new SpeechRecognition(); rec.lang="zh-CN"; rec.onstart=()=>setListening(true); rec.onend=()=>setListening(false); rec.onresult=(e:any)=>setInput(e.results[0][0].transcript); rec.start(); };
  return <div className="chat-page fade-in"><div className="chat-header"><div className="ai-orb"><Bot/></div><div><h1>澄心 AI 助理 <span>在线</span></h1><p>自然语言理解 · 操作前确认 · 全程可追溯</p></div><div className="guard"><ShieldCheck/> 安全模式</div></div><div className="messages">{messages.map(m=><div key={m.id} className={`message ${m.role}`}><div className="message-avatar">{m.role==="assistant"?<Sparkles/>:<UserRound/>}</div><div className="bubble"><p>{m.text}</p>{m.operation&&<OperationCard op={m.operation} onOpen={()=>onOperation(m.operation!)}/>} {m.suggestions&&<div className="suggestions">{m.suggestions.map(s=><button key={s} onClick={()=>onSend(s)}>{s}</button>)}</div>}</div></div>)}{loading&&<div className="message assistant"><div className="message-avatar"><Sparkles/></div><div className="bubble typing"><i/><i/><i/></div></div>}<div ref={end}/></div><div className="composer"><div className="safety-copy"><LockKeyhole size={13}/> 敏感操作会先生成确认卡，不会自动执行</div><div className="input-row"><button className={listening?"listening":""} onClick={voice} title="语音输入"><Mic/></button><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} placeholder="输入需求，例如：明天给李梅转 500 元" rows={1}/><button className="send" onClick={submit} disabled={!input.trim()||loading}><Send/></button></div><div className="demo-hints"><span>试试：</span><button onClick={()=>onSend("明天给李梅 13800138001 转500元")}>定时转账</button><button onClick={()=>onSend("聚餐600元，我不参与，张三李梅王强AA")}>AA 收款</button><button onClick={()=>onSend("分析本月异常交易")}>异常分析</button></div></div></div>;
}

function OperationCard({ op, onOpen }: { op: PendingOperation; onOpen:()=>void }) { return <div className="operation-card"><div className="op-head"><div><span>{op.riskLevel}</span><strong>{op.title}</strong></div><small>待确认</small></div><p>{op.summary}</p><div className="op-grid">{Object.entries(op.details).slice(0,6).map(([k,v])=><div key={k}><span>{detailLabel(k)}</span><strong>{String(v)}</strong></div>)}</div><button onClick={onOpen}>核对并继续 <ArrowRight size={16}/></button><small className="expiry"><FileClock size={13}/> 确认卡 10 分钟后过期</small></div>; }
const labels:Record<string,string>={payee:"收款人",phone:"手机号",bank:"收款账户",amount:"金额（元）",fee:"手续费",executeAt:"执行时间",memo:"备注",participants:"参与人",total:"总金额",perPerson:"每人金额",excludeSelf:"不含发起人",event:"事件",reservationMonth:"预留月份",shoppingTrigger:"购物提醒",merchantOrder:"商品下单"};
function detailLabel(k:string){return labels[k]??k;}

function OperationModal({operation,onClose,onDone}:{operation:PendingOperation;onClose:()=>void;onDone:()=>void}) { const [step,setStep]=useState<"review"|"auth"|"done">("review"); const [code,setCode]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const call=async(path:string,body?:unknown)=>{setBusy(true);setError("");try{const r=await fetch(`${API}/operations/${operation.operationId}/${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw new Error(d.message);return d;}catch(e){setError(e instanceof Error?e.message:"操作失败");}finally{setBusy(false);}}; const confirm=async()=>{const r=await call("confirm");if(r)setStep("auth");}; const execute=async()=>{const r=await call("execute",{authCode:code});if(r)setStep("done");}; return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal"><button className="modal-x" onClick={onClose}><X/></button>{step==="review"&&<><div className="modal-icon"><ShieldCheck/></div><span className="eyebrow">安全确认 · {operation.riskLevel}</span><h2>{operation.title}</h2><p className="modal-summary">{operation.summary}</p><div className="review-list">{Object.entries(operation.details).map(([k,v])=><div key={k}><span>{detailLabel(k)}</span><strong>{typeof v==="boolean"?(v?"是":"否"):String(v)}</strong></div>)}</div><div className="warning"><LockKeyhole/><p><strong>尚未执行</strong><span>继续后还需输入演示强认证码。</span></p></div>{error&&<p className="error">{error}</p>}<button className="primary wide" onClick={confirm} disabled={busy}>{busy?<Loader2 className="spin"/>:"信息无误，继续验证"}</button><button className="ghost wide" onClick={onClose}>取消</button></>}{step==="auth"&&<><div className="modal-icon"><LockKeyhole/></div><span className="eyebrow">第二步，共两步</span><h2>模拟强认证</h2><p className="modal-summary">请输入 6 位演示认证码。真实系统应在此接入银行可信设备或生物识别。</p><div className="code-input"><input autoFocus inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} placeholder="••••••"/><small>演示码：123456</small></div>{error&&<p className="error">{error}</p>}<button className="primary wide" onClick={execute} disabled={busy||code.length!==6}>{busy?<Loader2 className="spin"/>:"验证并执行"}</button><button className="ghost wide" onClick={()=>setStep("review")}>返回核对</button></>}{step==="done"&&<><div className="modal-icon success"><Check/></div><span className="eyebrow">已完成</span><h2>操作执行成功</h2><p className="modal-summary">系统已生成模拟回执并写入审计记录。</p><div className="receipt"><span>操作编号</span><strong>{operation.operationId.slice(0,8).toUpperCase()}</strong><span>执行时间</span><strong>{new Date().toLocaleString("zh-CN")}</strong></div><button className="primary wide" onClick={onDone}>完成</button></>}</div></div>; }

function BillsPage({data,onPrompt}:{data:DashboardData|null;onPrompt:(s:string)=>void}) { return <div className="page fade-in"><PageHead eyebrow="SMART INSIGHTS" title="账单分析" desc="分类由规则与 AI 辅助完成，异常判断来自确定性风控规则。" action="生成本月报告" onAction={()=>onPrompt("生成本月账单报告")}/><div className="three-stats"><Metric title="本月总支出" value={`¥${(data?.monthlySpend??10616).toLocaleString()}`} change="较上月 +8.4%" icon={<ArrowUpRight/>}/><Metric title="最大消费类别" value="住房" change="占本月 49%" icon={<Home/>}/><Metric title="待核对异常" value="1 笔" change="高优先级" icon={<ShieldCheck/>}/></div><div className="two-col"><div className="panel spending"><PanelTitle title="分类占比"/><SpendChart items={data?.categoryBreakdown??[]}/></div><div className="panel anomaly-box"><span className="risk-tag">高优先级</span><h3>环球数码港 · ¥4,299.00</h3><p>9 月 19 日 02:14 · 深圳</p><ul><li>凌晨大额消费</li><li>非常用城市</li><li>金额显著高于个人基线</li></ul><small>异常信号不代表欺诈，请先核对交易。</small><button className="primary" onClick={()=>onPrompt("分析本月异常交易")}>让 AI 解释</button></div></div><div className="panel"><PanelTitle title="最近交易与分类"/><TransactionList items={data?.recentTransactions??[]}/></div></div>; }

function WealthPage({onPrompt}:{onPrompt:(s:string)=>void}) { const products=[{name:"稳盈 30 天",risk:"R2 较低风险",term:"30天",rate:"2.35%",fee:"0.10%",ok:true},{name:"固收增强 180",risk:"R3 中等风险",term:"180天",rate:"3.62%",fee:"0.30%",ok:true},{name:"成长精选混合",risk:"R4 较高风险",term:"无固定期限",rate:"−4.80%",fee:"1.20%",ok:false}]; return <div className="page fade-in"><PageHead eyebrow="WEALTH" title="理财中心" desc="你的风险等级为 R3 · 稳健成长型。仅展示适配产品。" action="重新测评" onAction={()=>onPrompt("开始风险测评")}/><div className="disclaimer"><ShieldCheck/><div><strong>适当性提醒</strong><p>以下为模拟产品信息，不构成投资建议；历史表现不代表未来收益。</p></div></div><div className="product-grid">{products.map(p=><div className={`product ${!p.ok?"disabled":""}`} key={p.name}><div><span>{p.risk}</span>{!p.ok&&<i>不适配</i>}</div><h3>{p.name}</h3><small>近一年年化</small><strong className={p.rate.startsWith("−")?"negative":""}>{p.rate}</strong><dl><div><dt>期限</dt><dd>{p.term}</dd></div><div><dt>申购费</dt><dd>{p.fee}</dd></div><div><dt>流动性</dt><dd>{p.term==="30天"?"到期赎回":"定期开放"}</dd></div></dl><button disabled={!p.ok} onClick={()=>onPrompt(`比较${p.name}与其他适配产品`)}>{p.ok?"查看并比较":"风险等级不适配"}</button></div>)}</div></div>; }

function CardsPage({onPrompt}:{onPrompt:(s:string)=>void}) { return <div className="page fade-in"><PageHead eyebrow="CARD CONTROL" title="卡片管理" desc="敏感操作需要身份核验，完整卡号不会展示给 AI。"/><div className="card-layout"><div className="bank-card"><div className="card-logo"><Landmark/> 澄心银行</div><div className="chip"/><p>•••• &nbsp;•••• &nbsp;•••• &nbsp;5176</p><div><span>LIN XIAO</span><span>12/29</span></div></div><div className="panel card-info"><div><span>本期可用额度</span><strong>¥21,840.00</strong><small>总额度 ¥30,000.00</small></div><div className="limit-bar"><i style={{width:"72.8%"}}/></div><button onClick={()=>onPrompt("调整信用卡额度")}>申请调整额度 <ChevronRight/></button></div></div><div className="panel controls"><PanelTitle title="交易限制"/><ToggleRow title="线上交易" desc="允许在线商户使用此卡" checked/><ToggleRow title="境外交易" desc="当前已关闭境外商户支付"/><ToggleRow title="非接交易" desc="允许挥卡和移动支付" checked/><div className="danger-zone"><div><strong>卡片遗失？</strong><p>挂失后卡片将立即停止交易，需身份核验。</p></div><button onClick={()=>onPrompt("挂失尾号5176卡片")}>立即挂失</button></div></div></div>; }
function ToggleRow({title,desc,checked}:{title:string;desc:string;checked?:boolean}) { const [on,setOn]=useState(!!checked); return <div className="toggle-row"><div><strong>{title}</strong><span>{desc}</span></div><button className={on?"on":""} onClick={()=>setOn(!on)}><i/></button></div>; }

function SubscriptionsPage({onOperation}:{onOperation:(o:PendingOperation)=>void}) { const [items,setItems]=useState<any[]>([]); useEffect(()=>{fetch(`${API}/subscriptions`).then(r=>r.json()).then(setItems).catch(()=>setItems([{id:"s1",merchant:"网易云音乐",amount:15,cycle:"每月",nextCharge:"2026-10-18",capability:"direct_cancel",status:"ACTIVE"},{id:"s2",merchant:"视频会员",amount:25,cycle:"每月",nextCharge:"2026-10-08",capability:"manual",status:"ACTIVE"}]))},[]); const cancel=async(id:string)=>{const r=await fetch(`${API}/subscriptions/${id}/cancel`,{method:"POST"});const d=await r.json();if(d.operationId)onOperation(d);else alert(`该商户需手动取消：\n${d.steps.join("\n")}`)}; return <div className="page fade-in"><PageHead eyebrow="SUBSCRIPTIONS" title="订阅与代扣" desc="根据周期、商户和相似金额识别，取消能力以商户实际支持为准。"/><div className="subscription-total"><div><span>预计下月订阅支出</span><strong>¥{items.reduce((s,x)=>s+x.amount,0).toFixed(2)}</strong><small>{items.length} 项活跃订阅</small></div><CalendarClock/></div><div className="panel subscription-list">{items.map(x=><div key={x.id}><div className="merchant-logo">{x.merchant.slice(0,1)}</div><div><strong>{x.merchant}</strong><span>{x.cycle} · 下次 {x.nextCharge}</span></div><b>¥{x.amount.toFixed(2)}</b><button onClick={()=>cancel(x.id)}>{x.capability==="direct_cancel"?"取消订阅":"查看步骤"}</button></div>)}</div></div>; }

function AutomationsPage({onPrompt}:{onPrompt:(s:string)=>void}) { return <div className="page fade-in"><PageHead eyebrow="AUTOMATIONS" title="自动化中心" desc="定时任务只执行已授权动作；新资金用途仍需单独确认。" action="新建自动化" onAction={()=>onPrompt("创建一个新的自动化计划")}/><div className="automation-grid"><div className="automation featured"><div className="auto-icon"><Sparkles/></div><span>跨场景计划</span><h3>爱人生日计划</h3><p>11 月预留 ¥1,000，生日前 2 天生成鲜花与蛋糕确认单。</p><div className="timeline"><i className="done"/><div><strong>识别生日</strong><span>模拟日历 · 11 月 16 日</span></div><i/><div><strong>预留资金</strong><span>等待你的确认</span></div><i/><div><strong>准备礼物</strong><span>11 月 14 日 · 需另行确认</span></div></div><button onClick={()=>onPrompt("为爱人生日预留1000元")}>继续设置</button></div><div className="automation"><div className="auto-icon"><CalendarClock/></div><span>定时转账</span><h3>工资到账后储蓄</h3><p>每月 5 日将 ¥2,000 转入心愿储蓄账户。</p><div className="auto-status"><i/>运行中 <b>下次：10 月 5 日</b></div><button className="secondary">管理计划</button></div></div></div>; }

function AuditPage() { const [logs,setLogs]=useState<any[]>([]); useEffect(()=>{fetch(`${API}/audit`).then(r=>r.json()).then(setLogs).catch(()=>{})},[]); return <div className="page fade-in"><PageHead eyebrow="AUDIT TRAIL" title="安全审计" desc="模型建议、用户确认、强认证和执行结果相互分离并可追溯。"/><div className="audit-summary"><div><ShieldCheck/><strong>安全策略正常</strong><span>未检测到越权执行</span></div><div><FileClock/><strong>{logs.length} 条</strong><span>本会话审计事件</span></div><div><LockKeyhole/><strong>100%</strong><span>高风险操作有确认记录</span></div></div><div className="panel audit-list"><div className="audit-head"><span>时间</span><span>事件</span><span>结果</span><span>详情（已脱敏）</span></div>{logs.length===0?<div className="empty"><ShieldCheck/><p>还没有操作记录。完成一次转账演示后，这里会显示审计链。</p></div>:logs.map(x=><div className="audit-row" key={x.id}><span>{new Date(x.createdAt).toLocaleTimeString("zh-CN")}</span><strong>{x.action}</strong><i>{x.result}</i><span>{x.detail}</span></div>)}</div></div>; }

function PageHead({eyebrow,title,desc,action,onAction}:{eyebrow:string;title:string;desc:string;action?:string;onAction?:()=>void}) { return <div className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div>{action&&<button className="primary" onClick={onAction}><Sparkles/>{action}</button>}</div>; }
