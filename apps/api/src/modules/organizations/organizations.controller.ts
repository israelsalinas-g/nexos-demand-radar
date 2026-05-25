import { Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { OrganizationsService } from "./organizations.service";
import { CurrentUser } from "../../auth/current-user.decorator";

interface AuthUser {
  id: string;
  email: string;
}

@ApiTags("organizations")
@ApiBearerAuth()
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post("setup")
  setup(@CurrentUser() user: AuthUser) {
    return this.service.setup(user.id, user.email);
  }
}
