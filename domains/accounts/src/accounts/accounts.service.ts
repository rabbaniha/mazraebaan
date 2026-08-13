import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async create(dto: CreateAccountDto): Promise<Account> {
    const account = this.accountRepo.create({
      accountType: dto.accountType ?? 'individual',
      displayName: dto.displayName,
      countryCode: dto.countryCode,
      locale: dto.locale,
      timezone: dto.timezone,
      calendarPreference: dto.calendarPreference,
      measurementSystem: dto.measurementSystem,
      defaultCurrencyCode: dto.defaultCurrencyCode,
      dataRegion: dto.dataRegion,
      status: 'pending',
    });
    return this.accountRepo.save(account);
  }

  async findAll(): Promise<Account[]> {
    return this.accountRepo.find();
  }

  async findOne(id: string): Promise<Account | null> {
    return this.accountRepo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateAccountDto): Promise<Account | null> {
    const account = await this.accountRepo.findOne({ where: { id } });
    if (!account) return null;
    Object.assign(account, dto);
    return this.accountRepo.save(account);
  }

  async remove(id: string): Promise<boolean> {
    const account = await this.accountRepo.findOne({ where: { id } });
    if (!account) return false;
    await this.accountRepo.remove(account);
    return true;
  }
}
