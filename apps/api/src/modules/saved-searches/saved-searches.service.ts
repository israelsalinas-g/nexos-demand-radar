import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../db/prisma.service";
import { OrgContextService } from "../../common/org-context.service";
import { CreateSavedSearchDto } from "./dto/create-saved-search.dto";

@Injectable()
export class SavedSearchesService {
  constructor(
    private prisma: PrismaService,
    private orgCtx: OrgContextService,
  ) {}

  async create(userId: string, dto: CreateSavedSearchDto) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    return this.prisma.savedSearch.create({
      data: {
        organizationId: orgId,
        createdBy: userId,
        name: dto.name,
        keywords: dto.keywords ?? [],
        filters: (dto.filters ?? {}) as object,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(userId: string) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    return this.prisma.savedSearch.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const orgId = await this.orgCtx.getPrimaryOrgId(userId);
    const ss = await this.prisma.savedSearch.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!ss) throw new NotFoundException("Saved search not found");
    return ss;
  }

  async update(userId: string, id: string, dto: Partial<CreateSavedSearchDto>) {
    await this.findOne(userId, id);
    return this.prisma.savedSearch.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.keywords !== undefined && { keywords: dto.keywords }),
        ...(dto.filters !== undefined && { filters: dto.filters as object }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.savedSearch.delete({ where: { id } });
  }
}
