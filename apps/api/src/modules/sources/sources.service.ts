import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUES } from "@radar/queue";
import { PrismaService } from "../../db/prisma.service";
import { OrgContextService } from "../../common/org-context.service";
import { CreateSourceDto } from "./dto/create-source.dto";
import { UpdateSourceDto } from "./dto/update-source.dto";

@Injectable()
export class SourcesService {
  constructor(
    private prisma: PrismaService,
    private orgCtx: OrgContextService,
    @InjectQueue(QUEUES.COLLECT) private collectQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateSourceDto) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    return this.prisma.source.create({
      data: { ...dto, organizationId: orgId, config: {} },
    });
  }

  async findAll(userId: string) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    return this.prisma.source.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    const source = await this.prisma.source.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!source) throw new NotFoundException("Source not found");
    return source;
  }

  async update(userId: string, id: string, dto: UpdateSourceDto) {
    await this.findOne(userId, id);
    return this.prisma.source.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.source.delete({ where: { id } });
  }

  async triggerCollect(userId: string, id: string) {
    const source = await this.findOne(userId, id);
    await this.collectQueue.add(
      "collect",
      { sourceId: source.id },
      {
        jobId: `collect:${source.id}:manual`,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    );
    return { queued: true, sourceId: source.id };
  }
}
