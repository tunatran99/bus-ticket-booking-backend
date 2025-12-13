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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/guards/roles.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { TripsService } from '../trips/trips.service';
import { CreateTripDto } from '../trips/dto/create-trip.dto';
import { UpdateTripDto } from '../trips/dto/update-trip.dto';
import { TripStatus } from '../trips/trip.entity';

@ApiTags('Admin - Trips')
@Controller('admin/trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth('JWT-auth')
export class AdminTripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trip schedule' })
  @ApiResponse({ status: 201, description: 'Trip created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Scheduling conflict detected' })
  create(@Body() createTripDto: CreateTripDto) {
    return this.tripsService.create(createTripDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trips with optional filters' })
  @ApiQuery({ name: 'routeId', required: false, type: Number })
  @ApiQuery({ name: 'busId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TripStatus })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of trips' })
  findAll(
    @Query('routeId') routeId?: string,
    @Query('busId') busId?: string,
    @Query('status') status?: TripStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters: any = {};
    if (routeId) filters.routeId = parseInt(routeId, 10);
    if (busId) filters.busId = parseInt(busId, 10);
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return this.tripsService.findAll(Object.keys(filters).length > 0 ? filters : undefined);
  }

  @Get('available-buses')
  @ApiOperation({ summary: 'Get available buses for a time range' })
  @ApiQuery({ name: 'departureTime', required: true, type: String })
  @ApiQuery({ name: 'arrivalTime', required: true, type: String })
  @ApiResponse({ status: 200, description: 'List of available buses' })
  getAvailableBuses(
    @Query('departureTime') departureTime: string,
    @Query('arrivalTime') arrivalTime: string,
  ) {
    return this.tripsService.getAvailableBuses(new Date(departureTime), new Date(arrivalTime));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiResponse({ status: 200, description: 'Trip details' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a trip schedule' })
  @ApiResponse({ status: 200, description: 'Trip updated successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  @ApiResponse({ status: 409, description: 'Scheduling conflict detected' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTripDto: UpdateTripDto) {
    return this.tripsService.update(id, updateTripDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a trip' })
  @ApiResponse({ status: 200, description: 'Trip deleted successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.remove(id);
  }
}


