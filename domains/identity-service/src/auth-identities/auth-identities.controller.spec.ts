import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthIdentitiesController } from './auth-identities.controller';
import { AuthIdentitiesService } from './auth-identities.service';
import { AuthIdentity } from './entities/auth-identity.entity';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
};

describe('AuthIdentitiesController', () => {
  let controller: AuthIdentitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthIdentitiesController],
      providers: [
        AuthIdentitiesService,
        { provide: getRepositoryToken(AuthIdentity), useValue: mockRepo },
      ],
    }).compile();

    controller = module.get<AuthIdentitiesController>(AuthIdentitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
