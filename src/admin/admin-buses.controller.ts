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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { BusesService } from '../buses/buses.service';
import { CreateBusDto } from '../buses/dto/create-bus.dto';
import { UpdateBusDto } from '../buses/dto/update-bus.dto';
import { UpdateSeatLayoutDto } from '../buses/dto/update-seat-layout.dto';

@ApiTags('Admin - Buses')
@Controller('admin/buses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth('JWT-auth')
export class AdminBusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bus with seat layout' })
  @ApiResponse({ status: 201, description: 'Bus created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createBusDto: CreateBusDto) {
    return this.busesService.create(createBusDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all buses' })
  @ApiResponse({ status: 200, description: 'List of buses' })
  findAll() {
    return this.busesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bus by ID' })
  @ApiResponse({ status: 200, description: 'Bus details' })
  @ApiResponse({ status: 404, description: 'Bus not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.busesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bus' })
  @ApiResponse({ status: 200, description: 'Bus updated successfully' })
  @ApiResponse({ status: 404, description: 'Bus not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBusDto: UpdateBusDto) {
    return this.busesService.update(id, updateBusDto);
  }

  @Post(':id/seat-layout')
  @ApiOperation({ summary: 'Update bus seat layout (visual tool)' })
  @ApiResponse({ status: 200, description: 'Seat layout updated successfully' })
  @ApiResponse({ status: 404, description: 'Bus not found' })
  updateSeatLayout(@Param('id', ParseIntPipe) id: number, @Body() updateSeatLayoutDto: UpdateSeatLayoutDto) {
    return this.busesService.updateSeatLayout(id, updateSeatLayoutDto.seatLayouts);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bus' })
  @ApiResponse({ status: 200, description: 'Bus deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bus not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.busesService.remove(id);
  }
}

