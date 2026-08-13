import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshTokensService } from './refresh-tokens.service';
import { RefreshToken } from './entities/refresh-token.entity';

const mockRefreshTokenRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

describe('RefreshTokensService', () => {
  let service: RefreshTokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensService,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepo,
        },
      ],
    }).compile();

    service = module.get<RefreshTokensService>(RefreshTokensService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashToken', () => {
    it('returns a 64-char lowercase SHA-256 hex digest', () => {
      const hash = RefreshTokensService.hashToken('some-raw-token');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('never returns the raw token', () => {
      const raw = 'raw-secret-token-value';
      expect(RefreshTokensService.hashToken(raw)).not.toContain(raw);
    });
  });

  describe('createEntry', () => {
    it('persists a hashed entry with rotation meta', async () => {
      const entry = {
        userId: '01HZV9K7KX9P4P4P4P4P4P4P4P4',
        tokenHash: 'a'.repeat(64),
        familyId: '01HZV9K7KX9P4P4P4P4P4P4P4P5',
        expiresAt: new Date(),
        issuedIp: '127.0.0.1',
        issuedUserAgent: 'jest',
      };
      mockRefreshTokenRepo.create.mockReturnValue(entry);
      mockRefreshTokenRepo.save.mockResolvedValue({ id: 'token-id', ...entry });

      const result = await service.createEntry(entry);

      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith({
        ...entry,
        deviceId: null,
        revokedAt: null,
        replacedByTokenId: null,
      });
      expect(mockRefreshTokenRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('findValidByHash', () => {
    it('searches by hash with revoked null and unexpired filters', async () => {
      const token = { id: 't1' };
      mockRefreshTokenRepo.findOne.mockResolvedValue(token);

      const result = await service.findValidByHash('a'.repeat(64));

      const expectedWhere: Record<string, unknown> = {
        tokenHash: 'a'.repeat(64),
        revokedAt: expect.anything(),
        expiresAt: expect.anything(),
      };
      expect(mockRefreshTokenRepo.findOne).toHaveBeenCalledWith({
        where: expectedWhere,
      });
      expect(result).toEqual(token);
    });
  });

  describe('revokeByHash', () => {
    it('sets revoked_at on matching active token', async () => {
      mockRefreshTokenRepo.update.mockResolvedValue({ affected: 1 });

      const revoked = await service.revokeByHash('a'.repeat(64));

      expect(revoked).toBe(1);
      const expectedCriteria: Record<string, unknown> = {
        tokenHash: 'a'.repeat(64),
        revokedAt: expect.anything(),
      };
      const expectedPatch: Record<string, unknown> = {
        revokedAt: expect.any(Date),
      };
      expect(mockRefreshTokenRepo.update).toHaveBeenCalledWith(
        expectedCriteria,
        expectedPatch,
      );
    });
  });

  describe('revokeAllForUser', () => {
    it('revokes every active token of the user', async () => {
      mockRefreshTokenRepo.update.mockResolvedValue({ affected: 2 });

      const revoked = await service.revokeAllForUser('user-1');

      expect(revoked).toBe(2);
      const expectedCriteria: Record<string, unknown> = {
        userId: 'user-1',
        revokedAt: expect.anything(),
      };
      const expectedPatch: Record<string, unknown> = {
        revokedAt: expect.any(Date),
      };
      expect(mockRefreshTokenRepo.update).toHaveBeenCalledWith(
        expectedCriteria,
        expectedPatch,
      );
    });
  });
});
