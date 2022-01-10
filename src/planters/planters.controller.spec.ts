import { Test, TestingModule } from '@nestjs/testing';
import { PlantersController } from './planters.controller';

describe('PlantersController', () => {
  let controller: PlantersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantersController],
    }).compile();

    controller = module.get<PlantersController>(PlantersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
