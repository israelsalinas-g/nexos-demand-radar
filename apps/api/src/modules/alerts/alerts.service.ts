import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../db/prisma.service";
import { OrgContextService } from "../../common/org-context.service";
import { CreateAlertDto } from "./dto/create-alert.dto";

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private orgCtx: OrgContextService,
  ) {}

  async create(userId: string, dto: CreateAlertDto) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    return this.prisma.alert.create({
      data: {
        organizationId: orgId,
        createdBy: userId,
        name: dto.name,
        savedSearchId: dto.savedSearchId ?? null,
        channel: dto.channel,
        channelConfig: dto.channelConfig as object,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(userId: string) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    return this.prisma.alert.findMany({
      where: { organizationId: orgId },
      include: { savedSearch: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    const alert = await this.prisma.alert.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!alert) throw new NotFoundException("Alert not found");
    return alert;
  }

  async update(userId: string, id: string, dto: Partial<CreateAlertDto>) {
    await this.findOne(userId, id);
    return this.prisma.alert.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.channel !== undefined && { channel: dto.channel }),
        ...(dto.channelConfig !== undefined && { channelConfig: dto.channelConfig as object }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.savedSearchId !== undefined && { savedSearchId: dto.savedSearchId }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.alert.delete({ where: { id } });
  }

  async getRuns(userId: string, alertId: string) {
    await this.findOne(userId, alertId);
    return this.prisma.alertRun.findMany({
      where: { alertId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
