import { DocumentBuilder } from "@nestjs/swagger";

export const swaggerConfig = new DocumentBuilder()
  .setTitle("AI MEAL Platform API")
  .setDescription("AI Monitoring, Evaluation, Accountability and Learning Platform")
  .setVersion("1.0")
  .addBearerAuth()
  .build();
