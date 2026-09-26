import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Account, DashboardData, PendingOperation, Transaction } from "@bank-agent/contracts";

type Audit = { id: string; action: string; result: string; operationId?: string; createdAt: string; detail: string };

@Injectable()
export class DemoStore {
  readonly accounts: Account[] = [
    { id: "acc-main", name: "活期账户", last4: "8821", balance: 28640.52, available: 27640.52, currency: "CNY" },
    { id: "acc-save", name: "心愿储蓄", last4: "1906", balance: 12000, available: 12000, currency: "CNY" },
  ];

  readonly payees = [
    { id: "p1", name: "张三", phone: "13800138002", maskedPhone: "138****8002", bankName: "招商银行", last4: "6612" },
    { id: "p2", name: "张三", phone: "13900139003", maskedPhone: "139****9003", bankName: "建设银行", last4: "1028" },
    { id: "p3", name: "李梅", phone: "13800138001", maskedPhone: "138****8001", bankName: "工商银行", last4: "4309" },
    { id: "p4", name: "王强", phone: "13600136006", maskedPhone: "136****6006", bankName: "农业银行", last4: "7720" },
  ];

  readonly transactions: Transaction[] = [
    { id: "t1", merchant: "工资", amount: 18500, direction: "credit", category: "收入", confidence: 1, date: "2026-09-05T09:02:00+08:00", location: "上海" },
    { id: "t2", merchant: "盒马鲜生", amount: 326.4, direction: "debit", category: "购物", confidence: .96, date: "2026-09-22T18:42:00+08:00", location: "上海" },
    { id: "t3", merchant: "滴滴出行", amount: 48.6, direction: "debit", category: "交通", confidence: .99, date: "2026-09-22T08:16:00+08:00", location: "上海" },
    { id: "t4", merchant: "云海阁餐厅", amount: 688, direction: "debit", category: "餐饮", confidence: .92, date: "2026-09-20T20:15:00+08:00", location: "上海" },
    { id: "t5", merchant: "环球数码港", amount: 4299, direction: "debit", category: "购物", confidence: .88, date: "2026-09-19T02:14:00+08:00", location: "深圳", anomaly: { severity: "high", signals: ["凌晨大额消费", "非常用城市", "金额显著高于个人基线"] } },
    { id: "t6", merchant: "网易云音乐", amount: 15, direction: "debit", category: "订阅", confidence: .99, date: "2026-09-18T10:00:00+08:00", location: "线上" },
    { id: "t7", merchant: "星巴克", amount: 39, direction: "debit", category: "餐饮", confidence: .97, date: "2026-09-17T13:24:00+08:00", location: "上海" },
    { id: "t8", merchant: "住房租金", amount: 5200, direction: "debit", category: "住房", confidence: 1, date: "2026-09-01T09:30:00+08:00", location: "上海" },
  ];

  readonly products = [
    { id: "w1", name: "稳盈 30 天", risk: 2, term: "30天", liquidity: "到期赎回", performance: "近一年年化 2.35%", fee: "0.10%", eligible: true },
    { id: "w2", name: "固收增强 180", risk: 3, term: "180天", liquidity: "每周开放", performance: "近一年年化 3.62%", fee: "0.30%", eligible: true },
    { id: "w3", name: "成长精选混合", risk: 4, term: "无固定期限", liquidity: "T+1", performance: "近一年 -4.80%", fee: "1.20%", eligible: false },
  ];

  readonly cards = [
    { id: "c1", name: "澄心白金卡", last4: "5176", status: "ACTIVE", limit: 30000, available: 21840, controls: { online: true, overseas: false, contactless: true } },
  ];

  readonly subscriptions = [
    { id: "s1", merchant: "网易云音乐", amount: 15, cycle: "每月", nextCharge: "2026-10-18", capability: "direct_cancel", status: "ACTIVE" },
    { id: "s2", merchant: "视频会员", amount: 25, cycle: "每月", nextCharge: "2026-10-08", capability: "manual", status: "ACTIVE" },
    { id: "s3", merchant: "云盘空间", amount: 18, cycle: "每月", nextCharge: "2026-10-12", capability: "direct_cancel", status: "ACTIVE" },
  ];

  readonly automations: Array<Record<string, unknown>> = [
    { id: "a1", name: "工资到账后储蓄", schedule: "每月 5 日", status: "ACTIVE", nextRun: "2026-10-05", amount: 2000 },
    { id: "a2", name: "爱人生日计划", schedule: "11 月 16 日", status: "DRAFT", nextRun: "2026-11-01", amount: 1000 },
  ];

  readonly operations = new Map<string, PendingOperation>();
  readonly audit: Audit[] = [];
  private readonly executedKeys = new Map<string, PendingOperation>();

  dashboard(): DashboardData {
    const debits = this.transactions.filter(t => t.direction === "debit");
    const breakdown = new Map<string, number>();
    debits.forEach(t => breakdown.set(t.category, (breakdown.get(t.category) ?? 0) + t.amount));
    const colors: Record<string, string> = { 购物: "#7764e4", 住房: "#ef9164", 餐饮: "#37b494", 交通: "#4b91e6", 订阅: "#e7b64d" };
    return {
      user: { name: "林晓", greeting: "下午好" },
      accounts: this.accounts,
      monthlySpend: debits.reduce((sum, t) => sum + t.amount, 0),
      monthlyIncome: this.transactions.filter(t => t.direction === "credit").reduce((sum, t) => sum + t.amount, 0),
      pendingOperations: [...this.operations.values()].filter(o => ["PENDING_CONFIRMATION", "AWAITING_AUTH"].includes(o.status)).length,
      subscriptionTotal: this.subscriptions.filter(s => s.status === "ACTIVE").reduce((sum, s) => sum + s.amount, 0),
      categoryBreakdown: [...breakdown.entries()].map(([category, amount]) => ({ category, amount, color: colors[category] ?? "#9aa3b2" })).sort((a,b) => b.amount-a.amount),
      recentTransactions: this.transactions.slice().sort((a,b) => b.date.localeCompare(a.date)).slice(0, 6),
    };
  }

  createOperation(input: Omit<PendingOperation, "operationId" | "idempotencyKey" | "status" | "expiresAt" | "createdAt">) {
    const now = new Date();
    const op: PendingOperation = {
      ...input,
      operationId: randomUUID(),
      idempotencyKey: randomUUID(),
      status: "PENDING_CONFIRMATION",
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
    };
    this.operations.set(op.operationId, op);
    this.log("PREPARE_OPERATION", "SUCCESS", op.operationId, `${op.type}:${op.title}`);
    return op;
  }

  confirm(id: string) {
    const op = this.getOperation(id);
    this.assertNotExpired(op);
    if (op.status !== "PENDING_CONFIRMATION") throw new BadRequestException("当前操作不可确认");
    op.status = "AWAITING_AUTH";
    this.log("CONFIRM_OPERATION", "SUCCESS", id, "用户已查看并确认操作详情");
    return op;
  }

  execute(id: string, authCode: string) {
    const op = this.getOperation(id);
    const existing = this.executedKeys.get(op.idempotencyKey);
    if (existing) return existing;
    this.assertNotExpired(op);
    if (op.status !== "AWAITING_AUTH") throw new BadRequestException("操作尚未确认");
    if (authCode !== (process.env.DEMO_AUTH_CODE ?? "123456")) {
      this.log("EXECUTE_OPERATION", "DENIED", id, "强认证失败");
      throw new UnauthorizedException("强认证码错误");
    }
    if (["TRANSFER", "SCHEDULED_TRANSFER", "INVESTMENT", "FUND_RESERVATION", "MERCHANT_ORDER"].includes(op.type)) {
      const amount = Number(op.details.amount ?? 0);
      if (amount <= 0 || amount > this.accounts[0].available) throw new BadRequestException("余额不足或金额无效");
      if (op.type === "TRANSFER") {
        this.accounts[0].balance -= amount;
        this.accounts[0].available -= amount;
        this.transactions.unshift({ id: randomUUID(), merchant: String(op.details.payee), amount, direction: "debit", category: "转账", confidence: 1, date: new Date().toISOString(), location: "线上" });
      } else if (op.type === "FUND_RESERVATION") {
        this.accounts[0].available -= amount;
      } else if (op.type === "INVESTMENT" || op.type === "MERCHANT_ORDER") {
        this.accounts[0].balance -= amount;
        this.accounts[0].available -= amount;
        this.transactions.unshift({
          id: randomUUID(),
          merchant: String(op.details.product ?? op.details.merchant ?? "模拟商户订单"),
          amount,
          direction: "debit",
          category: op.type === "INVESTMENT" ? "理财" : "购物",
          confidence: 1,
          date: new Date().toISOString(),
          location: "线上",
        });
      }
    }
    if (op.type === "CARD_LOSS") {
      const card = this.cards.find(item => item.last4 === String(op.details.cardLast4));
      if (!card) throw new BadRequestException("卡片不存在");
      card.status = "LOST";
    }
    if (op.type === "SUBSCRIPTION_CANCEL") {
      const subscription = this.subscriptions.find(item => item.merchant === String(op.details.merchant));
      if (!subscription) throw new BadRequestException("订阅不存在");
      subscription.status = "CANCELLED";
    }
    op.status = "EXECUTED";
    this.executedKeys.set(op.idempotencyKey, op);
    this.log("EXECUTE_OPERATION", "SUCCESS", id, `${op.type} 已执行`);
    return op;
  }

  updateCategory(id: string, category: string) {
    const item = this.transactions.find(t => t.id === id);
    if (!item) throw new NotFoundException("交易不存在");
    item.category = category;
    item.confidence = 1;
    this.log("CORRECT_CATEGORY", "SUCCESS", undefined, `${id}:${category}`);
    return item;
  }

  cancelSubscription(id: string) {
    const item = this.subscriptions.find(s => s.id === id);
    if (!item) throw new NotFoundException("订阅不存在");
    if (item.capability !== "direct_cancel") return { status: "MANUAL_REQUIRED", steps: ["打开商户 App", "进入账户与订阅", "关闭自动续费"] };
    const op = this.createOperation({ type: "SUBSCRIPTION_CANCEL", riskLevel: "R2", title: `取消${item.merchant}`, summary: `停止${item.cycle}自动扣费`, details: { merchant: item.merchant, amount: item.amount } });
    return op;
  }

  getOperation(id: string) {
    const op = this.operations.get(id);
    if (!op) throw new NotFoundException("操作不存在");
    return op;
  }

  private assertNotExpired(op: PendingOperation) {
    if (new Date(op.expiresAt).getTime() < Date.now()) {
      op.status = "EXPIRED";
      throw new BadRequestException("确认已过期，请重新发起");
    }
  }

  private log(action: string, result: string, operationId: string | undefined, detail: string) {
    this.audit.unshift({ id: randomUUID(), action, result, operationId, detail, createdAt: new Date().toISOString() });
  }
}
