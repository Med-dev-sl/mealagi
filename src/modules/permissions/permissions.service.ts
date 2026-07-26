import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return { items };
  }
}
