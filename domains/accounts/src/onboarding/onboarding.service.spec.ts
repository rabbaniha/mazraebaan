import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ulid } from 'ulid';
import { OnboardingService } from './onboarding.service';
import { ProvisionOwnerAccountDto } from './dto/provision-owner-account.dto';
import { Account } from '../accounts/entities/account.entity';
import { AccountMember } from '../account-members/entities/account-member.entity';
import { AccountMemberRole } from '../account-members/entities/account-member-role.entity';
import { Role } from '../roles/entities/role.entity';

/* eslint-disable @typescript-eslint/unbound-method */

/** Builds a fake TypeORM repository whose every method is a jest mock. */
function fakeRepo<T extends object>(
  seed: Partial<T>[] = [],
): jest.Mocked<Repository<T>> {
  const store = [...seed] as T[];
  return {
    findOne: jest.fn(
      (opts: { where?: unknown }) =>
        store.find((r) =>
          JSON.stringify(r) === JSON.stringify(opts?.where) || opts == null
            ? null
            : null,
        ) ?? null,
    ) as never,
    find: jest.fn(() => store) as never,
    count: jest.fn(() => store.length) as never,
    save: jest.fn((entity: T) => {
      const created = { id: ulid(), ...(entity as object) } as T;
      store.push(created);
      return created;
    }) as never,
    create: jest.fn(
      (entity: T) => ({ id: ulid(), ...(entity as object) }) as T,
    ) as never,
    remove: jest.fn(() => undefined) as never,
  } as unknown as jest.Mocked<Repository<T>>;
}

describe('OnboardingService (accounts)', () => {
  let service: OnboardingService;
  let dataSource: jest.Mocked<DataSource>;
  let manager: jest.Mocked<EntityManager>;

  let accountRepo: jest.Mocked<Repository<Account>>;
  let memberRepo: jest.Mocked<Repository<AccountMember>>;
  let memberRoleRepo: jest.Mocked<Repository<AccountMemberRole>>;
  let roleRepo: jest.Mocked<Repository<Role>>;

  const makeDto = (
    overrides: Partial<ProvisionOwnerAccountDto> = {},
  ): ProvisionOwnerAccountDto => ({
    userId: ulid(),
    account: {
      displayName: 'مزرعه سارا',
      dataRegion: 'ir',
      accountType: 'individual',
    },
    ...overrides,
  });

  beforeEach(async () => {
    accountRepo = fakeRepo<Account>();
    memberRepo = fakeRepo<AccountMember>();
    memberRoleRepo = fakeRepo<AccountMemberRole>();
    roleRepo = fakeRepo<Role>();

    manager = {
      getRepository: jest.fn((target: unknown) => {
        if (target === Account) return accountRepo;
        if (target === AccountMember) return memberRepo;
        if (target === AccountMemberRole) return memberRoleRepo;
        if (target === Role) return roleRepo;
        return fakeRepo();
      }),
    } as unknown as jest.Mocked<EntityManager>;

    dataSource = {
      transaction: jest.fn(async (cb: (m: EntityManager) => Promise<unknown>) =>
        cb(manager),
      ),
      getRepository: jest.fn((target: unknown) => {
        if (target === Account) return accountRepo;
        if (target === AccountMember) return memberRepo;
        if (target === AccountMemberRole) return memberRoleRepo;
        if (target === Role) return roleRepo;
        return fakeRepo();
      }),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    service = module.get(OnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('provisions an account, member and owner role atomically for a new user', async () => {
    const dto = makeDto();

    const result = await service.provisionOwnerAccount(dto);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(accountRepo.save).toHaveBeenCalledTimes(1);
    expect(memberRepo.save).toHaveBeenCalledTimes(1);
    expect(memberRoleRepo.save).toHaveBeenCalledTimes(1);

    const savedAccount = accountRepo.save.mock.calls[0][0] as Account;
    expect(savedAccount.status).toBe('active');
    expect(savedAccount.displayName).toBe('مزرعه سارا');

    const savedMember = memberRepo.save.mock.calls[0][0] as AccountMember;
    expect(savedMember.userId).toBe(dto.userId);
    expect(savedMember.status).toBe('active');

    expect(result.alreadyProvisioned).toBe(false);
    expect(result.account).toBeDefined();
    expect(result.membership).toBeDefined();
  });

  it('creates the system owner role lazily when it does not exist yet', async () => {
    const dto = makeDto();

    await service.provisionOwnerAccount(dto);

    expect(roleRepo.findOne).toHaveBeenCalled();
    expect(roleRepo.save).toHaveBeenCalledTimes(1);
    const createdRole = roleRepo.save.mock.calls[0][0] as Role;
    expect(createdRole.name).toBe('owner');
    expect(createdRole.isSystem).toBe(true);
  });

  it('reuses an existing owner role instead of creating a duplicate', async () => {
    const existingOwner = {
      id: ulid(),
      name: 'owner',
      isSystem: true,
      description: null,
      rolePermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Role;
    roleRepo.findOne = jest.fn(() => existingOwner) as never;

    await service.provisionOwnerAccount(makeDto());

    expect(roleRepo.save).not.toHaveBeenCalled();
  });

  it('returns the existing account when the user already has an active membership (idempotent)', async () => {
    const userId = ulid();
    const existingMember = {
      id: ulid(),
      userId,
      status: 'active',
      account: { id: ulid(), displayName: 'قبلی' },
    } as unknown as AccountMember;
    memberRepo.findOne = jest.fn(() => existingMember) as never;

    const result = await service.provisionOwnerAccount(makeDto({ userId }));

    expect(result.alreadyProvisioned).toBe(true);
    expect(accountRepo.save).not.toHaveBeenCalled();
    expect(result.account).toMatchObject({ displayName: 'قبلی' });
  });

  it('reports no active account for a user with no membership', async () => {
    memberRepo.count = jest.fn(() => 0) as never;
    expect(await service.hasActiveAccount(ulid())).toBe(false);

    memberRepo.count = jest.fn(() => 1) as never;
    expect(await service.hasActiveAccount(ulid())).toBe(true);
  });
});
