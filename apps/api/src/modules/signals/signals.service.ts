import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../db/prisma.service";
import { OrgContextService } from "../../common/org-context.service";
import { QuerySignalsDto } from "./dto/query-signals.dto";

@Injectable()
export class SignalsService {
  constructor(
    private prisma: PrismaService,
    private orgCtx: OrgContextService,
  ) {}

  async findAll(userId: string, query: QuerySignalsDto) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    const since = this.periodToDate(query.period);

    const [signals, total] = await Promise.all([
      this.prisma.extractedSignal.findMany({
        where: {
          organizationId: orgId,
          ...(query.category && { category: query.category }),
          ...(query.intent && { intent: query.intent }),
          ...(query.minScore !== undefined && { score: { gte: query.minScore } }),
          ...(since && { extractedAt: { gte: since } }),
        },
        include: {
          item: {
            select: { title: true, url: true, publishedAt: true, body: true },
          },
        },
        orderBy: { score: "desc" },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.extractedSignal.count({
        where: {
          organizationId: orgId,
          ...(query.category && { category: query.category }),
          ...(query.intent && { intent: query.intent }),
          ...(query.minScore !== undefined && { score: { gte: query.minScore } }),
          ...(since && { extractedAt: { gte: since } }),
        },
      }),
    ]);

    return { signals, total };
  }

  async findOne(userId: string, id: string) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    return this.prisma.extractedSignal.findFirst({
      where: { id, organizationId: orgId },
      include: { item: true },
    });
  }

  private periodToDate(period?: string): Date | null {
    if (!period) return null;
    const daysMap: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30 };
    const days = daysMap[period];
    if (!days) return null;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }
}
