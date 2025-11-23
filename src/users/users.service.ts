import { Injectable, OnModuleInit } from '@nestjs/common';
import { User } from '../auth/interfaces/user.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  // In-memory user storage (replace with database in production)
  private users: User[] = [];

  async onModuleInit() {
    // Seed a default admin user for testing/demo
    const adminEmail = 'admin@example.com';
    const existingAdmin = await this.findByEmail(adminEmail);
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const admin: User = {
        userId: `usr_admin_${Date.now()}`,
        email: adminEmail,
        phone: '+84900000000',
        password: hashedPassword,
        fullName: 'Demo Admin',
        role: 'admin',
        createdAt: new Date(),
        emailVerified: false,
        phoneVerified: false,
      };
      this.users.push(admin);
    }
  }

  async create(userData: Partial<User>): Promise<User> {
    const user: User = {
      userId: `usr_${Date.now()}`,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      fullName: userData.fullName,
      role: userData.role || 'passenger',
      createdAt: new Date(),
      emailVerified: false,
      phoneVerified: false,
    };

    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async findByPhone(phone: string | undefined): Promise<User | undefined> {
    if (!phone) return undefined;
    return this.users.find((user) => user.phone === phone);
  }

  async findById(userId: string): Promise<User | undefined> {
    return this.users.find((user) => user.userId === userId);
  }

  async findByIdentifier(identifier: string): Promise<User | undefined> {
    return this.users.find(
      (user) => user.email === identifier || user.phone === identifier,
    );
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const user = await this.findById(userId);
    if (!user) return undefined;
    user.password = hashedPassword;
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }
}
