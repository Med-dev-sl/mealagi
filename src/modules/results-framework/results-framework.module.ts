import { Module } from "@nestjs/common";
import { ResultsFrameworkController } from "./results-framework.controller";
import { ResultsFrameworkService } from "./results-framework.service";
import { PrismaModule } from "../../core/database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ResultsFrameworkController],
  providers: [ResultsFrameworkService],
  exports: [ResultsFrameworkService],
})
export class ResultsFrameworkModule {}
