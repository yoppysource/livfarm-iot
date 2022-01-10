import { Test, TestingModule } from '@nestjs/testing';
import { PlantersService } from './planters.service';

describe('PlantersService', () => {
  let service: PlantersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlantersService],
    }).compile();

    service = module.get<PlantersService>(PlantersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
