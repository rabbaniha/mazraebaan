import { Test, TestingModule } from '@nestjs/testing';
import { StaffAccessGrantsService } from './staff-access-grants.service';

describe('StaffAccessGrantsService', () => {
  let service: StaffAccessGrantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StaffAccessGrantsService],
    }).compile();

    service = module.get<StaffAccessGrantsService>(StaffAccessGrantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
