import { IsString, IsOptional, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { LogframeStatus } from "@prisma/client";

export class UpdateLogframeDto {
  @ApiPropertyOptional({ description: "Logframe title", example: "Results Framework for CHI v2" })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: "Logframe description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: LogframeStatus, description: "Change status" })
  @IsEnum(LogframeStatus)
  @IsOptional()
  status?: LogframeStatus;
}
