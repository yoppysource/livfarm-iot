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

  // @Post('/images/:planterId/:floor')
  // async createSnapshot(
  //   @Param('planterId') planterId: string,
  //   @Param('floor') floor: string,
  //   @Body() body,
  //   @Req() req,
  // ) {
  //   // we have to check req.readable because of raw-body issue #57
  //   // https://github.com/stream-utils/raw-body/issues/57
  //   if (req.readable) {
  //     // body is ignored by NestJS -> get raw body from request
  //     const raw = await rawbody(req);
  //     body = raw.toString().trim();
  //   }

  //   return this.snapshotsService.create(body, planterId, parseInt(floor));
  // }
  @Get('/test')
  async createSnapshot() {
    return this.snapshotsService.createSnapshotsPeriodically();
  }
}
