import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AgentService } from "./agent.service";
import { DemoStore } from "./demo.store";
import { DeepSeekService } from "./deepseek.service";

@Module({
  controllers: [AppController],
  providers: [DemoStore, DeepSeekService, AgentService],
})
export class AppModule {}
