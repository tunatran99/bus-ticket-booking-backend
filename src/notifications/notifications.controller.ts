import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TokenPayload } from "../auth/interfaces/user.interface";
import { NotificationsService } from "./notifications.service";
import { UpdateNotificationPreferencesDto } from "./dto/update-preferences.dto";

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("preferences")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get notification preferences" })
  @ApiResponse({ status: 200, description: "Preferences returned" })
  async getPreferences(@Req() req: AuthenticatedRequest) {
    const prefs = await this.notificationsService.getPreferences(
      req.user?.userId,
    );
    return {
      success: true,
      data: prefs,
    };
  }

  @Put("preferences")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update notification preferences" })
  async updatePreferences(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const prefs = await this.notificationsService.updatePreferences(
      req.user!.userId,
      dto,
    );
    return {
      success: true,
      data: prefs,
    };
  }
}
