import { PlantersModule } from './../planters/planters.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { SnapshotsController } from './snapshots.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Planter, PlanterSchema } from 'src/schemas/planter.schema';
import { Snapshot, SnapshotSchema } from 'src/schemas/snapshot.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        name: Planter.name,
        schema: PlanterSchema,
      },
      {
        name: Snapshot.name,
        schema: SnapshotSchema,
      },
    ]),
    PlantersModule,
  ],
  providers: [SnapshotsService],
  controllers: [SnapshotsController],
})
export class SnapshotsModule {}
