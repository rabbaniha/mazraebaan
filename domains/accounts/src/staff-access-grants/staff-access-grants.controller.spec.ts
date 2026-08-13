import { Test, TestingModule } from '@nestjs/testing';
import { StaffAccessGrantsController } from './staff-access-grants.controller';
import { StaffAccessGrantsService } from './staff-access-grants.service';

describe('StaffAccessGrantsController', () => {
  let controller: StaffAccessGrantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffAccessGrantsController],
      providers: [StaffAccessGrantsService],
    }).compile();

    controller = module.get<StaffAccessGrantsController>(
      StaffAccessGrantsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
