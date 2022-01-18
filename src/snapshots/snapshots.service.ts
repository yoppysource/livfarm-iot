import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosResponse } from 'axios';
import { model, Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { Planter } from 'src/schemas/planter.schema';
import { Snapshot } from 'src/schemas/snapshot.schema';
import * as sharp from 'sharp';
import * as fs from 'fs';
import { PythonShell } from 'python-shell';
import { Cron, CronExpression } from '@nestjs/schedule';
var path = require('path');
@Injectable()
export class SnapshotsService {
  constructor(
    @InjectModel(Snapshot.name)
    private snapshotModel: Model<Snapshot>,
    @InjectModel(Planter.name)
    private planterModel: Model<Planter>,
    private httpService: HttpService,
  ) {}
  private readonly logger = new Logger(SnapshotsService.name);

  async findAll(): Promise<Snapshot[]> {
    return this.snapshotModel.find().exec();
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async createSnapshotsPeriodically() {
    this.logger.debug('Call create Snapshot every 4 hours');
    const plantersIncludeCam = (await this.planterModel.find({})).filter(
      (planter) => planter.cameras.length > 0,
    );
    this.logger.debug(plantersIncludeCam.length);

    // promise.all 로 수정
    if (plantersIncludeCam) {
      for (const planter of plantersIncludeCam) {
        // How to get data from planter
        this.logger.debug(planter);

        const snapshot = new this.snapshotModel();
        this.logger.debug(planter.getUrl(['current']));

        const res: AxiosResponse = await lastValueFrom(
          this.httpService.get(planter.getUrl(['current'])),
        );

        if (res.status != 200) {
          continue;
        }
        Object.assign(snapshot, res.data);
        for (const cam of planter.cameras) {
          const now = new Date();
          snapshot.createdAt = now;
          const imageName = `${cam.cameraId}_${Date.now()}`;
          const numOfPixel = await this.getPixelAndSaveImage(
            imageName,
            `http://${cam.publicIP}:${cam.webPort}`,
          );
          if (cam.plantId) snapshot.plantId = cam.plantId;
          if (cam.transferredAt) snapshot.transferredAt = cam.transferredAt;
          snapshot.numOfPixel = numOfPixel;
          snapshot.imageName = imageName;
          this.logger.debug(snapshot);
          return snapshot.save();
        }
      }
    }
  }

  async getPixelAndSaveImage(fileName: string, cameraURL: string) {
    const transformer = sharp().extract({
      left: 100,
      top: 0,
      width: 600,
      height: 600,
    });
    const writeStream = fs.createWriteStream(
      path.join('.', 'images', `${fileName}.jpeg`),
    );

    const response: AxiosResponse = await this.httpService.axiosRef({
      url: cameraURL + '/capture',
      method: 'GET',
      responseType: 'stream',
    });
    await response.data.pipe(transformer).pipe(writeStream);
    // await response.data.pipe(writeStream);
    const result = await new Promise((resolve, reject) => {
      PythonShell.run(
        './python/get_pixel.py',
        { args: [`./images/${fileName}.jpeg`] },
        (err, results) => {
          if (err) return reject(err);
          return resolve(results);
        },
      );
    });
    console.log(result);
    return parseInt(result[0]);
  }
}
