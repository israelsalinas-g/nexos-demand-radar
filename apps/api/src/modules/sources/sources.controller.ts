import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthUser } from "../../auth/current-user.decorator";
import { SourcesService } from "./sources.service";
import { CreateSourceDto } from "./dto/create-source.dto";
import { UpdateSourceDto } from "./dto/update-source.dto";

@ApiTags("sources")
@ApiBearerAuth()
@Controller("sources")
export class SourcesController {
  constructor(private sourcesService: SourcesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSourceDto) {
    return this.sourcesService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.sourcesService.findAll(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.sourcesService.findOne(user.id, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateSourceDto,
  ) {
    return this.sourcesService.update(user.id, id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.sourcesService.remove(user.id, id);
  }

  @Post(":id/collect")
  triggerCollect(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.sourcesService.triggerCollect(user.id, id);
  }
}
