import { Controller, Get, Query, Param, ParseIntPipe } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from "@nestjs/swagger";
import { TripsService } from "./trips.service";
import { SearchTripsDto, SortBy } from "./dto/search-trips.dto";

@ApiTags("Trips")
@Controller("trips")
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get("search")
  @ApiOperation({
    summary: "Search trips with filters, sorting, and pagination",
  })
  @ApiQuery({ name: "origin", required: false, type: String })
  @ApiQuery({ name: "destination", required: false, type: String })
  @ApiQuery({ name: "date", required: false, type: String })
  @ApiQuery({ name: "timeFrom", required: false, type: String })
  @ApiQuery({ name: "timeTo", required: false, type: String })
  @ApiQuery({ name: "minPrice", required: false, type: Number })
  @ApiQuery({ name: "maxPrice", required: false, type: Number })
  @ApiQuery({ name: "busType", required: false, type: String })
  @ApiQuery({ name: "sortBy", required: false, enum: SortBy })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Search results with pagination" })
  async search(@Query() searchDto: SearchTripsDto) {
    const result = await this.tripsService.searchTrips({
      origin: searchDto.origin,
      destination: searchDto.destination,
      date: searchDto.date,
      timeFrom: searchDto.timeFrom,
      timeTo: searchDto.timeTo,
      minPrice: searchDto.minPrice,
      maxPrice: searchDto.maxPrice,
      busType: searchDto.busType,
      sortBy: searchDto.sortBy,
      page: searchDto.page,
      limit: searchDto.limit,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get trip details by ID" })
  @ApiResponse({ status: 200, description: "Trip details" })
  @ApiResponse({ status: 404, description: "Trip not found" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const trip = await this.tripsService.findOne(id);
    return {
      success: true,
      data: trip,
    };
  }
}
