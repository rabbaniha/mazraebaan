import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthIdentitiesService } from './auth-identities.service';
import { AuthIdentity } from './entities/auth-identity.entity';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
};

describe('AuthIdentitiesService', () => {
  let service: AuthIdentitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthIdentitiesService,
        { provide: getRepositoryToken(AuthIdentity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AuthIdentitiesService>(AuthIdentitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
