import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteEntity } from './route.entity';
import { RouteStopEntity } from './route-stop.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(RouteEntity)
    private readonly routesRepository: Repository<RouteEntity>,
    @InjectRepository(RouteStopEntity)
    private readonly stopsRepository: Repository<RouteStopEntity>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<RouteEntity> {
    if (!createRouteDto.stops || createRouteDto.stops.length < 2) {
      throw new BadRequestException('Route must have at least 2 stops');
    }

    // Validate stop order
    const orders = createRouteDto.stops.map((s) => s.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i) {
        throw new BadRequestException(`Stop orders must be consecutive starting from 0. Found: ${orders.join(', ')}`);
      }
    }

    const route = this.routesRepository.create({
      name: createRouteDto.name,
      description: createRouteDto.description,
      distance: createRouteDto.distance,
      estimatedDuration: createRouteDto.estimatedDuration,
      isActive: createRouteDto.isActive ?? true,
    });

    const savedRoute = await this.routesRepository.save(route);

    // Create stops
    const stops = createRouteDto.stops.map((stopDto) =>
      this.stopsRepository.create({
        routeId: savedRoute.id,
        ...stopDto,
      }),
    );

    await this.stopsRepository.save(stops);

    return this.findOne(savedRoute.id);
  }

  async findAll(): Promise<RouteEntity[]> {
    return this.routesRepository.find({
      relations: ['stops'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<RouteEntity> {
    const route = await this.routesRepository.findOne({
      where: { id },
      relations: ['stops'],
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return route;
  }

  async update(id: number, updateRouteDto: UpdateRouteDto): Promise<RouteEntity> {
    const route = await this.findOne(id);

    if (updateRouteDto.stops) {
      if (updateRouteDto.stops.length < 2) {
        throw new BadRequestException('Route must have at least 2 stops');
      }

      // Delete existing stops
      await this.stopsRepository.delete({ routeId: id });

      // Create new stops
      const stops = updateRouteDto.stops.map((stopDto) =>
        this.stopsRepository.create({
          routeId: id,
          ...stopDto,
        }),
      );

      await this.stopsRepository.save(stops);
    }

    Object.assign(route, {
      name: updateRouteDto.name ?? route.name,
      description: updateRouteDto.description ?? route.description,
      distance: updateRouteDto.distance ?? route.distance,
      estimatedDuration: updateRouteDto.estimatedDuration ?? route.estimatedDuration,
      isActive: updateRouteDto.isActive ?? route.isActive,
    });

    await this.routesRepository.save(route);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const route = await this.findOne(id);
    await this.routesRepository.remove(route);
  }
}


