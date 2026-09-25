import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { AgentService } from "./agent.service";
import { DemoStore } from "./demo.store";
import { CategoryDto, ChatDto, ExecuteDto } from "./dto";

@Controller()
export class AppController {
  constructor(private readonly agent: AgentService, private readonly store: DemoStore) {}

  @Get("health") health() { return { status: "ok", mode: process.env.DEMO_MODE === "false" ? "infrastructure" : "demo", time: new Date().toISOString() }; }
  @Get("dashboard") dashboard() { return this.store.dashboard(); }
  @Get("transactions") transactions() { return this.store.transactions; }
  @Get("products") products() { return { riskProfile: { level: 3, label: "稳健成长型" }, products: this.store.products }; }
  @Get("cards") cards() { return this.store.cards; }
  @Get("subscriptions") subscriptions() { return this.store.subscriptions; }
  @Get("automations") automations() { return this.store.automations; }
  @Get("audit") audit() { return this.store.audit; }
  @Get("operations") operations() { return [...this.store.operations.values()]; }

  @Post("chat") chat(@Body() body: ChatDto) { return this.agent.chat(body.message); }
  @Post("operations/:id/confirm") confirm(@Param("id") id: string) { return this.store.confirm(id); }
  @Post("operations/:id/execute") execute(@Param("id") id: string, @Body() body: ExecuteDto) { return this.store.execute(id, body.authCode); }
  @Patch("transactions/:id/category") category(@Param("id") id: string, @Body() body: CategoryDto) { return this.store.updateCategory(id, body.category); }
  @Post("subscriptions/:id/cancel") cancel(@Param("id") id: string) { return this.store.cancelSubscription(id); }
}
