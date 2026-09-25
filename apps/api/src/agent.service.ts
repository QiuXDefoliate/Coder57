import { Injectable } from "@nestjs/common";
import type { ChatResponse, Payee } from "@bank-agent/contracts";
import { DemoStore } from "./demo.store";
import { DeepSeekService } from "./deepseek.service";

@Injectable()
export class AgentService {
  constructor(private readonly store: DemoStore, private readonly deepSeek: DeepSeekService) {}

  async chat(text: string): Promise<ChatResponse> {
    if (this.hasSensitiveData(text)) return { intent: "security", message: "请不要发送完整卡号、身份证号、密码或验证码。我没有保存这段敏感信息。", suggestions: ["查询账户余额", "查看本月账单"] };
    if (this.isInjection(text)) return { intent: "security", message: "我不能绕过授权、确认或风控规则。可以继续帮你按安全流程办理。", suggestions: ["查看待确认操作"] };
    const modelRoute = await this.deepSeek.routeIntent(text);
    const intent = modelRoute?.confidence && modelRoute.confidence > .7 ? modelRoute.intent : this.localIntent(text);

    if (intent === "transfer" || intent === "scheduled_transfer") return this.transfer(text, intent === "scheduled_transfer");
    if (intent === "split") return this.split(text);
    if (intent === "bill_analysis") return this.billAnalysis();
    if (intent === "wealth") return this.wealth(text);
    if (intent === "card") return this.card(text);
    if (intent === "subscription") return this.subscription(text);
    if (intent === "automation") return this.birthdayPlan(text);
    if (intent === "account_query") return { intent, message: `活期账户余额 ¥${this.store.accounts[0].balance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}，可用余额 ¥${this.store.accounts[0].available.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}。`, suggestions: ["分析本月账单", "查看异常交易"] };
    return { intent: "general", message: "我可以协助转账、AA 收款、账单分析、理财产品比较、卡片管理、订阅识别和生日计划。涉及资金的动作都会先生成确认卡。", suggestions: ["给张三转200元", "分析本月异常交易", "为爱人生日预留1000元"] };
  }

  private transfer(text: string, scheduled: boolean): ChatResponse {
    const amount = this.extractAmount(text);
    const payees = this.resolvePayees(text);
    if (!amount) return { intent: scheduled ? "scheduled_transfer" : "transfer", message: "请告诉我具体转账金额。" };
    if (!payees.length) return { intent: scheduled ? "scheduled_transfer" : "transfer", message: "没有找到对应收款人，请提供姓名或已绑定手机号。" };
    if (payees.length > 1) return { intent: "transfer", message: `找到 ${payees.length} 位“张三”：${payees.map(p => `${p.bankName}尾号${p.last4}（${p.maskedPhone}）`).join("；")}。请指定其中一位。` };
    if (amount > this.store.accounts[0].available) return { intent: "transfer", message: "可用余额不足，无法准备这笔转账。" };
    const payee = payees[0];
    const when = scheduled ? (text.includes("明天") ? this.tomorrowAtNine() : "2026-10-01T09:00:00+08:00") : "立即";
    const operation = this.store.createOperation({
      type: scheduled ? "SCHEDULED_TRANSFER" : "TRANSFER",
      riskLevel: "R2",
      title: scheduled ? "确认定时转账" : "确认转账",
      summary: `从活期账户（尾号 8821）向${payee.name}转账 ¥${amount.toFixed(2)}`,
      details: { payee: payee.name, phone: payee.maskedPhone, bank: `${payee.bankName} · ${payee.last4}`, amount, fee: 0, executeAt: when, memo: "无" },
    });
    return { intent: scheduled ? "scheduled_transfer" : "transfer", message: "已准备好操作，请核对确认卡。现在还没有扣款。", operation };
  }

  private split(text: string): ChatResponse {
    const total = this.extractAmount(text);
    const names = ["张三", "李梅", "王强"].filter(n => text.includes(n));
    if (!total || names.length === 0) return { intent: "split", message: "请提供 AA 总金额和参与人，例如“600 元，张三李梅王强 AA”。" };
    const perPerson = Math.round((total / names.length) * 100) / 100;
    const operation = this.store.createOperation({ type: "SPLIT_REQUEST", riskLevel: "R1", title: "确认发起 AA 收款", summary: `向 ${names.length} 人发起共 ¥${total.toFixed(2)} 的收款`, details: { participants: names.join("、"), total, perPerson, excludeSelf: /我不参与|不含我/.test(text) } });
    return { intent: "split", message: `已按每人 ¥${perPerson.toFixed(2)} 生成收款草案，请确认后发送。`, operation };
  }

  private billAnalysis(): ChatResponse {
    const anomaly = this.store.transactions.find(t => t.anomaly);
    return { intent: "bill_analysis", message: `本月支出 ¥${this.store.dashboard().monthlySpend.toFixed(2)}。检测到 1 笔需关注交易：${anomaly?.merchant} ¥${anomaly?.amount.toFixed(2)}，信号包括${anomaly?.anomaly?.signals.join("、")}。这些信号不代表交易一定是欺诈，请先核对。`, suggestions: ["查看账单分类", "管理尾号5176卡片"] };
  }

  private wealth(text: string): ChatResponse {
    if (!/申购|买入/.test(text)) return { intent: "wealth", message: "你的演示风险等级为 R3（稳健成长型）。当前可匹配稳盈 30 天和固收增强 180；历史表现不代表未来，申购前请阅读产品条款。", suggestions: ["比较两款可选产品", "申购稳盈30天1000元"] };
    const amount = this.extractAmount(text);
    const product = this.store.products.find(item => text.replace(/\s/g, "").includes(item.name.replace(/\s/g, "")));
    if (!product) return { intent: "wealth", message: "请指定要申购的产品，例如“稳盈 30 天”或“固收增强 180”。" };
    if (!product.eligible) return { intent: "wealth", message: `${product.name} 的风险等级高于你的当前适配范围，不能为你准备申购。` };
    if (!amount) return { intent: "wealth", message: "请告诉我申购金额。" };
    const operation = this.store.createOperation({ type: "INVESTMENT", riskLevel: "R3", title: "确认理财申购", summary: `申购${product.name} ¥${amount.toFixed(2)}`, details: { product: product.name, amount, risk: product.risk, term: product.term, fee: product.fee, performance: product.performance } });
    return { intent: "wealth", message: "已生成模拟申购确认单。历史表现不代表未来，确认前请核对期限、风险和费用。", operation };
  }

  private card(text: string): ChatResponse {
    if (/挂失/.test(text)) {
      const operation = this.store.createOperation({ type: "CARD_LOSS", riskLevel: "R3", title: "确认卡片挂失", summary: "挂失澄心白金卡（尾号 5176）", details: { cardLast4: "5176", effect: "执行后立即停止交易", reversible: false } });
      return { intent: "card", message: "已准备挂失操作。挂失执行后卡片会立即停止交易，请核对并完成身份验证。", operation };
    }
    if (/额度/.test(text)) return { intent: "card", message: "额度调整需要提供期望额度，并由规则引擎模拟审批。当前总额度为 ¥30,000，请告诉我期望额度。" };
    return { intent: "card", message: "白金卡（尾号 5176）状态正常，线上交易和非接交易已开启，境外交易已关闭。挂失、解冻或额度调整都需要确认与强认证。", suggestions: ["挂失尾号5176卡片", "查看交易限制"] };
  }

  private subscription(text: string): ChatResponse {
    if (/取消|关闭/.test(text)) {
      const subscription = this.store.subscriptions.find(item => text.includes(item.merchant));
      if (!subscription) return { intent: "subscription", message: "请指定要取消的订阅商户。" };
      const result = this.store.cancelSubscription(subscription.id) as any;
      if (result.operationId) return { intent: "subscription", message: "该商户支持直接取消，已生成确认卡；现在尚未取消。", operation: result };
      return { intent: "subscription", message: `该商户不支持银行侧直接取消。请按以下步骤处理：${result.steps.join(" → ")}` };
    }
    const active = this.store.subscriptions.filter(item => item.status === "ACTIVE");
    return { intent: "subscription", message: `识别到 ${active.length} 项月度订阅，合计 ¥${active.reduce((s,x)=>s+x.amount,0).toFixed(2)}。其中支持直接取消的项目会先生成确认卡。`, suggestions: ["取消网易云音乐", "查看续费日历"] };
  }

  private birthdayPlan(text: string): ChatResponse {
    if (/订购|下单|购买/.test(text) && /鲜花|蛋糕/.test(text)) {
      if (!/送到|地址/.test(text)) return { intent: "automation", message: "请先提供收货地址。地址不会发送给模型之外的无关服务，生成订单前仍需再次确认。" };
      const amount = this.extractAmount(text) ?? 688;
      const operation = this.store.createOperation({ type: "MERCHANT_ORDER", riskLevel: "R3", title: "确认生日礼物订单", summary: `订购鲜花与蛋糕，合计 ¥${amount.toFixed(2)}`, details: { merchant: "花礼与甜点模拟商户", items: "鲜花、蛋糕", amount, delivery: "生日前2天", address: "已提供（详情脱敏）" } });
      return { intent: "automation", message: "已生成模拟商户订单确认卡。请核对商品、金额和配送时间；当前尚未下单。", operation };
    }
    const amount = this.extractAmount(text) ?? 1000;
    const operation = this.store.createOperation({ type: "FUND_RESERVATION", riskLevel: "R2", title: "确认生日资金预留", summary: `从活期可用余额中预留 ¥${amount.toFixed(2)}`, details: { event: "爱人生日", amount, reservationMonth: "2026-11", shoppingTrigger: "生日前2天", merchantOrder: "需另行确认" } });
    return { intent: "automation", message: "已找到模拟日历中的爱人生日（11 月 16 日）。先确认资金预留；鲜花和蛋糕会在生日前两天另行生成购物确认单。", operation };
  }

  private localIntent(text: string) {
    if (/AA|均摊|平摊|收款/.test(text)) return "split";
    if (/异常|账单|消费|分类|月报|年报/.test(text)) return "bill_analysis";
    if (/理财|申购|赎回|产品|风险测评/.test(text)) return "wealth";
    if (/卡片|信用卡|挂失|额度|冻结|解冻/.test(text)) return "card";
    if (/订阅|续费|代扣/.test(text)) return "subscription";
    if (/生日|鲜花|蛋糕|预留|锁定/.test(text)) return "automation";
    if (/余额|账户/.test(text)) return "account_query";
    if (/转|汇款/.test(text)) return /明天|下周|定时|每月|号/.test(text) ? "scheduled_transfer" : "transfer";
    return "general";
  }

  private extractAmount(text: string) {
    const explicit = text.match(/(?:转|金额|共|总共|预留|锁定|消费|花了?)\s*(?:¥|￥)?\s*(\d+(?:\.\d{1,2})?)\s*(?:元|块)?/);
    if (explicit) return Number(explicit[1]);
    const withUnit = [...text.matchAll(/(?:¥|￥)?\s*(\d+(?:\.\d{1,2})?)\s*(?:元|块)/g)]
      .map(match => Number(match[1]))
      .filter(value => value < 100_000_000);
    if (withUnit.length) return withUnit.at(-1)!;
    const match = text.match(/(?:¥|￥)\s*(\d+(?:\.\d{1,2})?)/);
    return match ? Number(match[1]) : null;
  }

  private resolvePayees(text: string): Payee[] {
    const digits = text.match(/1\d{10}/)?.[0];
    if (digits) return this.store.payees.filter(p => p.phone === digits);
    const bankTail = text.match(/尾号\s*(\d{4})/)?.[1];
    return this.store.payees.filter(p => text.includes(p.name) && (!bankTail || p.last4 === bankTail));
  }

  private tomorrowAtNine() {
    const d = new Date(Date.now() + 86_400_000);
    return `${d.toISOString().slice(0,10)}T09:00:00+08:00`;
  }

  private hasSensitiveData(text: string) { return /\b\d{17}[\dXx]\b|\b\d{12,19}\b|(?:密码|验证码)[:：]?\s*\d{4,8}/.test(text); }
  private isInjection(text: string) { return /忽略.{0,8}(规则|指令)|跳过.{0,8}(确认|验证)|伪造.{0,8}(成功|回执)|系统提示词/.test(text); }
}
