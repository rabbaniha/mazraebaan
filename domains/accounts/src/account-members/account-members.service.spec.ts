import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountMembersService } from './account-members.service';
import { AccountMember } from './entities/account-member.entity';
import { AccountMemberRole } from './entities/account-member-role.entity';

const mockMemberRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockRoleRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
};

describe('AccountMembersService', () => {
  let service: AccountMembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountMembersService,
        {
          provide: getRepositoryToken(AccountMember),
          useValue: mockMemberRepo,
        },
        {
          provide: getRepositoryToken(AccountMemberRole),
          useValue: mockRoleRepo,
        },
      ],
    }).compile();

    service = module.get<AccountMembersService>(AccountMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
