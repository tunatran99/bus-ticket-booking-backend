import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BusEntity } from "./bus.entity";
import { SeatLayoutEntity, SeatType } from "./seat-layout.entity";
import { CreateBusDto, CreateSeatLayoutDto } from "./dto/create-bus.dto";
import { UpdateBusDto } from "./dto/update-bus.dto";

@Injectable()
export class BusesService {
  constructor(
    @InjectRepository(BusEntity)
    private readonly busesRepository: Repository<BusEntity>,
    @InjectRepository(SeatLayoutEntity)
    private readonly seatLayoutsRepository: Repository<SeatLayoutEntity>,
  ) {}

  async create(createBusDto: CreateBusDto): Promise<BusEntity> {
    // Check if license plate already exists
    const existing = await this.busesRepository.findOne({
      where: { licensePlate: createBusDto.licensePlate },
    });

    if (existing) {
      throw new BadRequestException(
        `Bus with license plate ${createBusDto.licensePlate} already exists`,
      );
    }

    const bus = this.busesRepository.create({
      licensePlate: createBusDto.licensePlate,
      brand: createBusDto.brand,
      model: createBusDto.model,
      totalSeats: createBusDto.totalSeats,
      status: createBusDto.status ?? "active",
      notes: createBusDto.notes,
    });

    const savedBus = await this.busesRepository.save(bus);

    // Create seat layouts if provided
    if (createBusDto.seatLayouts && createBusDto.seatLayouts.length > 0) {
      if (createBusDto.seatLayouts.length !== createBusDto.totalSeats) {
        throw new BadRequestException(
          `Number of seat layouts (${createBusDto.seatLayouts.length}) must match total seats (${createBusDto.totalSeats})`,
        );
      }

      const seatLayouts = createBusDto.seatLayouts.map((layoutDto) =>
        this.seatLayoutsRepository.create({
          busId: savedBus.id,
          ...layoutDto,
          seatType: layoutDto.seatType ?? SeatType.REGULAR,
          isActive: layoutDto.isActive ?? true,
        }),
      );

      await this.seatLayoutsRepository.save(seatLayouts);
    }

    return this.findOne(savedBus.id);
  }

  async findAll(): Promise<BusEntity[]> {
    return this.busesRepository.find({
      relations: ["seatLayouts"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: number): Promise<BusEntity> {
    const bus = await this.busesRepository.findOne({
      where: { id },
      relations: ["seatLayouts"],
    });

    if (!bus) {
      throw new NotFoundException(`Bus with ID ${id} not found`);
    }

    return bus;
  }

  async update(id: number, updateBusDto: UpdateBusDto): Promise<BusEntity> {
    const bus = await this.findOne(id);

    if (
      updateBusDto.licensePlate &&
      updateBusDto.licensePlate !== bus.licensePlate
    ) {
      const existing = await this.busesRepository.findOne({
        where: { licensePlate: updateBusDto.licensePlate },
      });

      if (existing) {
        throw new BadRequestException(
          `Bus with license plate ${updateBusDto.licensePlate} already exists`,
        );
      }
    }

    if (updateBusDto.seatLayouts) {
      // Delete existing seat layouts
      await this.seatLayoutsRepository.delete({ busId: id });

      // Create new seat layouts
      const seatLayouts = updateBusDto.seatLayouts.map((layoutDto) =>
        this.seatLayoutsRepository.create({
          busId: id,
          ...layoutDto,
          seatType: layoutDto.seatType ?? SeatType.REGULAR,
          isActive: layoutDto.isActive ?? true,
        }),
      );

      await this.seatLayoutsRepository.save(seatLayouts);

      // Update total seats if provided
      if (
        updateBusDto.totalSeats &&
        updateBusDto.totalSeats !== seatLayouts.length
      ) {
        throw new BadRequestException(
          `Number of seat layouts (${seatLayouts.length}) must match total seats (${updateBusDto.totalSeats})`,
        );
      }
    }

    Object.assign(bus, {
      licensePlate: updateBusDto.licensePlate ?? bus.licensePlate,
      brand: updateBusDto.brand ?? bus.brand,
      model: updateBusDto.model ?? bus.model,
      totalSeats: updateBusDto.totalSeats ?? bus.totalSeats,
      status: updateBusDto.status ?? bus.status,
      notes: updateBusDto.notes ?? bus.notes,
    });

    await this.busesRepository.save(bus);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const bus = await this.findOne(id);
    await this.busesRepository.remove(bus);
  }

  async updateSeatLayout(
    busId: number,
    seatLayouts: CreateSeatLayoutDto[],
  ): Promise<BusEntity> {
    const bus = await this.findOne(busId);

    // Delete existing seat layouts
    await this.seatLayoutsRepository.delete({ busId });

    // Create new seat layouts
    const layouts: SeatLayoutEntity[] = [];
    for (const layoutDto of seatLayouts) {
      const layout = this.seatLayoutsRepository.create({
        busId,
        ...layoutDto,
        seatType: layoutDto.seatType ?? SeatType.REGULAR,
        isActive: layoutDto.isActive ?? true,
      });
      layouts.push(layout);
    }

    await this.seatLayoutsRepository.save(layouts);

    // Update total seats
    bus.totalSeats = layouts.length;
    await this.busesRepository.save(bus);

    return this.findOne(busId);
  }
}
