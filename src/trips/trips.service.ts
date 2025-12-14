import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TripEntity, TripStatus } from "./trip.entity";
import { BusEntity } from "../buses/bus.entity";
import { RouteEntity } from "../routes/route.entity";
import { CreateTripDto } from "./dto/create-trip.dto";
import { UpdateTripDto } from "./dto/update-trip.dto";

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(TripEntity)
    private readonly tripsRepository: Repository<TripEntity>,
    @InjectRepository(BusEntity)
    private readonly busesRepository: Repository<BusEntity>,
    @InjectRepository(RouteEntity)
    private readonly routesRepository: Repository<RouteEntity>,
  ) {}

  async create(createTripDto: CreateTripDto): Promise<TripEntity> {
    // Verify bus exists
    const bus = await this.busesRepository.findOne({
      where: { id: createTripDto.busId },
    });
    if (!bus) {
      throw new NotFoundException(
        `Bus with ID ${createTripDto.busId} not found`,
      );
    }

    if (bus.status !== "active") {
      throw new BadRequestException(`Bus ${bus.licensePlate} is not active`);
    }

    // Verify route exists
    const route = await this.routesRepository.findOne({
      where: { id: createTripDto.routeId },
      relations: ["stops"],
    });
    if (!route) {
      throw new NotFoundException(
        `Route with ID ${createTripDto.routeId} not found`,
      );
    }

    const departureTime = new Date(createTripDto.departureTime);
    const arrivalTime = createTripDto.arrivalTime
      ? new Date(createTripDto.arrivalTime)
      : new Date(departureTime.getTime() + route.estimatedDuration * 60 * 1000);

    // Check for scheduling conflicts
    await this.checkBusConflict(
      createTripDto.busId,
      departureTime,
      arrivalTime,
    );

    const trip = this.tripsRepository.create({
      routeId: createTripDto.routeId,
      busId: createTripDto.busId,
      departureTime,
      arrivalTime,
      basePrice: createTripDto.basePrice,
      status: createTripDto.status ?? TripStatus.SCHEDULED,
      availableSeats: bus.totalSeats,
      notes: createTripDto.notes,
    });

    return this.tripsRepository.save(trip);
  }

  async findAll(filters?: {
    routeId?: number;
    busId?: number;
    status?: TripStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<TripEntity[]> {
    const queryBuilder = this.tripsRepository
      .createQueryBuilder("trip")
      .leftJoinAndSelect("trip.route", "route")
      .leftJoinAndSelect("route.stops", "stops")
      .leftJoinAndSelect("trip.bus", "bus")
      .leftJoinAndSelect("bus.seatLayouts", "seatLayouts");

    if (filters?.routeId) {
      queryBuilder.andWhere("trip.routeId = :routeId", {
        routeId: filters.routeId,
      });
    }

    if (filters?.busId) {
      queryBuilder.andWhere("trip.busId = :busId", { busId: filters.busId });
    }

    if (filters?.status) {
      queryBuilder.andWhere("trip.status = :status", {
        status: filters.status,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere("trip.departureTime >= :dateFrom", {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere("trip.departureTime <= :dateTo", {
        dateTo: filters.dateTo,
      });
    }

    return queryBuilder.orderBy("trip.departureTime", "ASC").getMany();
  }

  async findOne(id: number): Promise<TripEntity> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: ["route", "route.stops", "bus", "bus.seatLayouts"],
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    return trip;
  }

  async update(id: number, updateTripDto: UpdateTripDto): Promise<TripEntity> {
    const trip = await this.findOne(id);

    if (updateTripDto.busId && updateTripDto.busId !== trip.busId) {
      const bus = await this.busesRepository.findOne({
        where: { id: updateTripDto.busId },
      });
      if (!bus) {
        throw new NotFoundException(
          `Bus with ID ${updateTripDto.busId} not found`,
        );
      }
      if (bus.status !== "active") {
        throw new BadRequestException(`Bus ${bus.licensePlate} is not active`);
      }
    }

    if (updateTripDto.routeId && updateTripDto.routeId !== trip.routeId) {
      const route = await this.routesRepository.findOne({
        where: { id: updateTripDto.routeId },
      });
      if (!route) {
        throw new NotFoundException(
          `Route with ID ${updateTripDto.routeId} not found`,
        );
      }
    }

    const departureTime = updateTripDto.departureTime
      ? new Date(updateTripDto.departureTime)
      : trip.departureTime;
    const route = await this.routesRepository.findOne({
      where: { id: updateTripDto.routeId ?? trip.routeId },
    });
    const arrivalTime = updateTripDto.arrivalTime
      ? new Date(updateTripDto.arrivalTime)
      : route
        ? new Date(
            departureTime.getTime() + route.estimatedDuration * 60 * 1000,
          )
        : trip.arrivalTime;

    // Check for scheduling conflicts (excluding current trip)
    const busId = updateTripDto.busId ?? trip.busId;
    await this.checkBusConflict(busId, departureTime, arrivalTime, id);

    Object.assign(trip, {
      routeId: updateTripDto.routeId ?? trip.routeId,
      busId: updateTripDto.busId ?? trip.busId,
      departureTime,
      arrivalTime,
      basePrice: updateTripDto.basePrice ?? trip.basePrice,
      status: updateTripDto.status ?? trip.status,
      notes: updateTripDto.notes ?? trip.notes,
    });

    return this.tripsRepository.save(trip);
  }

  async remove(id: number): Promise<void> {
    const trip = await this.findOne(id);
    await this.tripsRepository.remove(trip);
  }

  /**
   * Check if a bus has scheduling conflicts for the given time range
   * @param busId Bus ID to check
   * @param departureTime Trip departure time
   * @param arrivalTime Trip arrival time
   * @param excludeTripId Trip ID to exclude from conflict check (for updates)
   * @throws ConflictException if a conflict is found
   */
  private async checkBusConflict(
    busId: number,
    departureTime: Date,
    arrivalTime: Date,
    excludeTripId?: number,
  ): Promise<void> {
    const conflictingTrips = await this.tripsRepository.find({
      where: [
        { busId, status: TripStatus.SCHEDULED },
        { busId, status: TripStatus.IN_PROGRESS },
      ],
    });

    for (const existingTrip of conflictingTrips) {
      // Skip the trip being updated
      if (excludeTripId && existingTrip.id === excludeTripId) {
        continue;
      }

      // Check for time overlap
      const hasConflict =
        (departureTime >= existingTrip.departureTime &&
          departureTime < (existingTrip.arrivalTime || new Date())) ||
        (arrivalTime > existingTrip.departureTime &&
          arrivalTime <= (existingTrip.arrivalTime || new Date())) ||
        (departureTime <= existingTrip.departureTime &&
          arrivalTime >= (existingTrip.arrivalTime || new Date()));

      if (hasConflict) {
        const bus = await this.busesRepository.findOne({
          where: { id: busId },
        });
        throw new ConflictException(
          `Bus ${bus?.licensePlate} is already scheduled for a trip from ${existingTrip.departureTime.toISOString()} to ${existingTrip.arrivalTime?.toISOString() || "TBD"}`,
        );
      }
    }
  }

  /**
   * Get available buses for a given time range
   */
  async getAvailableBuses(
    departureTime: Date,
    arrivalTime: Date,
  ): Promise<BusEntity[]> {
    const allBuses = await this.busesRepository.find({
      where: { status: "active" },
      relations: ["trips"],
    });

    const availableBuses = allBuses.filter((bus) => {
      const conflictingTrips = bus.trips?.filter(
        (trip) =>
          (trip.status === TripStatus.SCHEDULED ||
            trip.status === TripStatus.IN_PROGRESS) &&
          ((departureTime >= trip.departureTime &&
            departureTime < (trip.arrivalTime || new Date())) ||
            (arrivalTime > trip.departureTime &&
              arrivalTime <= (trip.arrivalTime || new Date())) ||
            (departureTime <= trip.departureTime &&
              arrivalTime >= (trip.arrivalTime || new Date()))),
      );

      return !conflictingTrips || conflictingTrips.length === 0;
    });

    return availableBuses;
  }

  /**
   * Search trips with filters, sorting, and pagination
   */
  async searchTrips(filters: {
    origin?: string;
    destination?: string;
    date?: string;
    timeFrom?: string;
    timeTo?: string;
    minPrice?: number;
    maxPrice?: number;
    busType?: string;
    amenities?: string[];
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    trips: TripEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.tripsRepository
      .createQueryBuilder("trip")
      .leftJoinAndSelect("trip.route", "route")
      .leftJoinAndSelect("route.stops", "stops")
      .leftJoinAndSelect("trip.bus", "bus")
      .leftJoinAndSelect("bus.seatLayouts", "seatLayouts")
      .where("trip.status = :status", { status: TripStatus.SCHEDULED })
      .andWhere("route.isActive = :isActive", { isActive: true });

    // Filter by origin (check if first stop matches or route name contains origin)
    if (filters.origin) {
      queryBuilder.andWhere(
        `(EXISTS (
          SELECT 1 FROM route_stops rs1 
          WHERE rs1."routeId" = route.id 
          AND rs1."order" = 0 
          AND LOWER(rs1."locationName") LIKE LOWER(:origin)
        ) OR LOWER(route.name) LIKE LOWER(:originPattern))`,
        {
          origin: `%${filters.origin}%`,
          originPattern: `%${filters.origin}%`,
        },
      );
    }

    // Filter by destination (check if any stop matches and is not the origin, or route name contains destination)
    if (filters.destination) {
      queryBuilder.andWhere(
        `(EXISTS (
          SELECT 1 FROM route_stops rs2 
          WHERE rs2."routeId" = route.id 
          AND rs2."order" > 0 
          AND LOWER(rs2."locationName") LIKE LOWER(:destination)
        ) OR LOWER(route.name) LIKE LOWER(:destinationPattern))`,
        {
          destination: `%${filters.destination}%`,
          destinationPattern: `%${filters.destination}%`,
        },
      );
    }

    // Filter by date
    if (filters.date) {
      const date = new Date(filters.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      queryBuilder.andWhere(
        "trip.departureTime >= :dateFrom AND trip.departureTime < :dateTo",
        {
          dateFrom: date,
          dateTo: nextDay,
        },
      );
    } else {
      // Only show future trips
      queryBuilder.andWhere("trip.departureTime >= :now", { now: new Date() });
    }

    // Filter by time range
    if (filters.timeFrom) {
      const [hours, minutes] = filters.timeFrom.split(":").map(Number);
      const timeFrom = new Date();
      timeFrom.setHours(hours, minutes || 0, 0, 0);
      queryBuilder.andWhere(
        "EXTRACT(HOUR FROM trip.departureTime) * 60 + EXTRACT(MINUTE FROM trip.departureTime) >= :timeFromMinutes",
        {
          timeFromMinutes: hours * 60 + (minutes || 0),
        },
      );
    }

    if (filters.timeTo) {
      const [hours, minutes] = filters.timeTo.split(":").map(Number);
      queryBuilder.andWhere(
        "EXTRACT(HOUR FROM trip.departureTime) * 60 + EXTRACT(MINUTE FROM trip.departureTime) <= :timeToMinutes",
        {
          timeToMinutes: hours * 60 + (minutes || 0),
        },
      );
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      queryBuilder.andWhere("trip.basePrice >= :minPrice", {
        minPrice: filters.minPrice,
      });
    }
    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere("trip.basePrice <= :maxPrice", {
        maxPrice: filters.maxPrice,
      });
    }

    // Filter by bus type (seat type)
    if (filters.busType) {
      queryBuilder.andWhere("seatLayouts.seatType = :busType", {
        busType: filters.busType,
      });
    }

    if (filters.amenities && filters.amenities.length > 0) {
      filters.amenities.forEach((amenity, index) => {
        queryBuilder.andWhere(
          `LOWER(COALESCE(bus.amenities, '')) LIKE :amenity${index}`,
          {
            [`amenity${index}`]: `%${amenity.toLowerCase()}%`,
          },
        );
      });
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Sorting
    const sortBy = filters.sortBy || "time_asc";
    switch (sortBy) {
      case "price_asc":
        queryBuilder.orderBy("trip.basePrice", "ASC");
        break;
      case "price_desc":
        queryBuilder.orderBy("trip.basePrice", "DESC");
        break;
      case "time_asc":
        queryBuilder.orderBy("trip.departureTime", "ASC");
        break;
      case "time_desc":
        queryBuilder.orderBy("trip.departureTime", "DESC");
        break;
      case "duration_asc":
        queryBuilder.orderBy("route.estimatedDuration", "ASC");
        break;
      case "duration_desc":
        queryBuilder.orderBy("route.estimatedDuration", "DESC");
        break;
      default:
        queryBuilder.orderBy("trip.departureTime", "ASC");
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const trips = await queryBuilder.getMany();

    return {
      trips,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
