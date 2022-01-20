import { SnapshotsService } from './snapshots.service';
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import * as rawbody from 'raw-body';
@Controller('snapshots')
export class SnapshotsController {
  constructor(private snapshotsService: SnapshotsService) {}
  @Get()
  findSnaphots() {
    return this.snapshotsService.findAll();
  }
  @Get('/test')
  async createSnapshot() {
    return this.snapshotsService.createSnapshotsPeriodically();
  }
}
