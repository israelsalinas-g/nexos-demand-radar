import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../db/prisma.service";

@Injectable()
export class OrgContextService {
  constructor(private prisma: PrismaService) {}

  async getPrimaryOrgId(userId: string): Promise<string> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId },
      select: { organizationId: true },
    });
    if (!membership) {
      throw new NotFoundException(
        "User does not belong to any organization. Create one first.",
      );
    }
    return membership.organizationId;
  }
}
