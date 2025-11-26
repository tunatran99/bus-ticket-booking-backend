import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { User as DomainUser } from '../auth/interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  private mapToDomain(user: UserEntity | null): DomainUser | undefined {
    if (!user) return undefined;
    return {
      userId: user.user_id,
      email: user.email,
      phone: user.phone ?? undefined,
      password: user.password,
      fullName: user.full_name,
      role: user.role as any,
      createdAt: user.created_at,
      emailVerified: false,
      phoneVerified: false,
    };
  }

  async create(userData: Partial<DomainUser>): Promise<DomainUser> {
    const entity = this.repo.create({
      user_id: userData.userId ?? randomUUID(),
      email: userData.email!,
      phone: userData.phone ?? null,
      password: userData.password!,
      full_name: userData.fullName!,
      role: userData.role ?? 'passenger',
      status: 'active',
    });
    const created = await this.repo.save(entity);
    return this.mapToDomain(created)!;
  }

  async findByEmail(email: string): Promise<DomainUser | undefined> {
    const user = await this.repo.findOne({ where: { email } });
    return this.mapToDomain(user);
  }

  async findByPhone(phone: string | undefined): Promise<DomainUser | undefined> {
    if (!phone) return undefined;
    const user = await this.repo.findOne({ where: { phone } });
    return this.mapToDomain(user);
  }

  async findById(userId: string): Promise<DomainUser | undefined> {
    const user = await this.repo.findOne({ where: { user_id: userId } });
    return this.mapToDomain(user);
  }

  async findByIdentifier(identifier: string): Promise<DomainUser | undefined> {
    const user = await this.repo.findOne({
      where: [{ email: identifier }, { phone: identifier } as any],
    });
    return this.mapToDomain(user);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<DomainUser | undefined> {
    await this.repo.update({ user_id: userId }, { password: hashedPassword });
    const user = await this.repo.findOne({ where: { user_id: userId } });
    return this.mapToDomain(user);
  }

  async findAll(): Promise<DomainUser[]> {
    const users = await this.repo.find();
    return users.map((u) => this.mapToDomain(u)!);
  }
}
