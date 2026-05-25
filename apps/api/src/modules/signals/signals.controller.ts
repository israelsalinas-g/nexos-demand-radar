import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, type AuthUser } from "../../auth/current-user.decorator";
import { SignalsService } from "./signals.service";
import { QuerySignalsDto } from "./dto/query-signals.dto";

@ApiTags("signals")
@ApiBearerAuth()
@Controller("signals")
export class SignalsController {
  constructor(private signalsService: SignalsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QuerySignalsDto) {
    return this.signalsService.findAll(user.id, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.signalsService.findOne(user.id, id);
  }
}
