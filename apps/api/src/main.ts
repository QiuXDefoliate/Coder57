import "reflect-metadata";
import { config } from "dotenv";
import { resolve } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

config({ path: resolve(process.cwd(), process.cwd().endsWith("api") ? "../../.env" : ".env") });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(Number(process.env.API_PORT ?? 4000));
  console.log(`Bank Agent API running at http://localhost:${process.env.API_PORT ?? 4000}/api`);
}
bootstrap();
