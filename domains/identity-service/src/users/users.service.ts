import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Create a new user.
   * This is called by AuthService during registration.
   * The Auth module never touches the User repo directly.
   */
  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: dto.displayName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      phoneCountryCode: dto.phoneCountryCode,
      avatarUrl: dto.avatarUrl,
      birthDate: dto.birthDate,
      locale: dto.locale,
      timezone: dto.timezone,
      calendarPreference: dto.calendarPreference,
      status: 'pending',
    });
    return this.userRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return this.userRepo.findOne({ where: { email: normalized } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async activate(id: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    user.status = 'active';
    return this.userRepo.save(user);
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return false;
    await this.userRepo.remove(user);
    return true;
  }
}
