import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountInvitesController } from './account-invites.controller';
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

describe('AccountInvitesController', () => {
  let controller: AccountInvitesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountInvitesController],
      providers: [
        AccountInvitesService,
        {
          provide: getRepositoryToken(AccountInvite),
          useValue: mockInviteRepo,
        },
        { provide: AccountMembersService, useValue: mockAccountMembersService },
      ],
    }).compile();

    controller = module.get<AccountInvitesController>(AccountInvitesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
