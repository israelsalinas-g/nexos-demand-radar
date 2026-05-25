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
import { SavedSearchesService } from "./saved-searches.service";
import { CreateSavedSearchDto } from "./dto/create-saved-search.dto";

@ApiTags("saved-searches")
@ApiBearerAuth()
@Controller("saved-searches")
export class SavedSearchesController {
  constructor(private service: SavedSearchesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSavedSearchDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.service.findOne(user.id, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: Partial<CreateSavedSearchDto>,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.service.remove(user.id, id);
  }
}
