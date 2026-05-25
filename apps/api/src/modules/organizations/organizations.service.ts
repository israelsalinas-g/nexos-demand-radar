import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../db/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async setup(userId: string, userEmail: string) {
    const existing = await this.prisma.organizationMember.findFirst({
      where: { userId },
      select: { organizationId: true },
    });

    if (existing) {
      return { organizationId: existing.organizationId, created: false };
    }

    const orgName = userEmail.split("@")[0];
    const org = await this.prisma.organization.create({
      data: {
        name: orgName,
        plan: "free",
        members: { create: { userId, role: "owner" } },
      },
    });

    return { organizationId: org.id, created: true };
  }
}
