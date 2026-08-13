import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountMembersController } from './account-members.controller';
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

describe('AccountMembersController', () => {
  let controller: AccountMembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountMembersController],
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

    controller = module.get<AccountMembersController>(AccountMembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
