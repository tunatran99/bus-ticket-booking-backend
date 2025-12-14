import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../rbac/guards/roles.guard";
import { Roles } from "../rbac/decorators/roles.decorator";
import { RoutesService } from "../routes/routes.service";
import { CreateRouteDto } from "../routes/dto/create-route.dto";
import { UpdateRouteDto } from "../routes/dto/update-route.dto";

@ApiTags("Admin - Routes")
@Controller("admin/routes")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
@ApiBearerAuth("JWT-auth")
export class AdminRoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new route with multiple stops" })
  @ApiResponse({ status: 201, description: "Route created successfully" })
  @ApiResponse({ status: 400, description: "Bad request" })
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(createRouteDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all routes" })
  @ApiResponse({ status: 200, description: "List of routes" })
  findAll() {
    return this.routesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a route by ID" })
  @ApiResponse({ status: 200, description: "Route details" })
  @ApiResponse({ status: 404, description: "Route not found" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.routesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a route" })
  @ApiResponse({ status: 200, description: "Route updated successfully" })
  @ApiResponse({ status: 404, description: "Route not found" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return this.routesService.update(id, updateRouteDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a route" })
  @ApiResponse({ status: 200, description: "Route deleted successfully" })
  @ApiResponse({ status: 404, description: "Route not found" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.routesService.remove(id);
  }
}
