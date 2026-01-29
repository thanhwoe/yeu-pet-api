import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { accounts } from '@app/generated/prisma/client';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) return null;

    return user;
  }

  async findByEmail(email: string): Promise<accounts | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByPhone(phone: string): Promise<accounts | null> {
    return this.usersRepository.findByPhone(phone);
  }

  async findByEmailOrPhone(identifier: string): Promise<accounts | null> {
    this.logger.debug(`Finding user by identifier: ${identifier}`);
    return this.usersRepository.findByEmailOrPhone(identifier);
  }

  async create(data: CreateUserDto) {
    // Check duplicate phone
    const phoneExists = await this.usersRepository.existsByPhone(data.phone);
    if (phoneExists) {
      throw new ConflictException('Phone number already exists');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await this.usersRepository.create({
      password_hash: hashedPassword,
      phone: data.phone,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
    });

    return user;
  }

  private async hashPassword(value: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(value, salt);
  }
}
