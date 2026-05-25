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
import { AlertsService } from "./alerts.service";
import { CreateAlertDto } from "./dto/create-alert.dto";

@ApiTags("alerts")
@ApiBearerAuth()
@Controller("alerts")
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAlertDto) {
    return this.alertsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.alertsService.findAll(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.alertsService.findOne(user.id, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: Partial<CreateAlertDto>,
  ) {
    return this.alertsService.update(user.id, id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.alertsService.remove(user.id, id);
  }

  @Get(":id/runs")
  getRuns(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.alertsService.getRuns(user.id, id);
  }
}
