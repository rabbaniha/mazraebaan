import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountInvitesService } from './account-invites.service';
import { AccountInvite } from './entities/account-invite.entity';
import { AccountMembersService } from '../account-members/account-members.service';

const mockInviteRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockAccountMembersService = {
  create: jest.fn(),
};

describe('AccountInvitesService', () => {
  let service: AccountInvitesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountInvitesService,
        {
          provide: getRepositoryToken(AccountInvite),
          useValue: mockInviteRepo,
        },
        { provide: AccountMembersService, useValue: mockAccountMembersService },
      ],
    }).compile();

    service = module.get<AccountInvitesService>(AccountInvitesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
