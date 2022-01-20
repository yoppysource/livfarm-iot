import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { Planter } from 'src/schemas/planter.schema';
import { Snapshot } from 'src/schemas/snapshot.schema';
import * as sharp from 'sharp';
import * as fs from 'fs';
import { PythonShell } from 'python-shell';
import { Cron, CronExpression } from '@nestjs/schedule';
var path = require('path');
import { once } from 'events';
import { ControlService } from 'src/planters/control.service';

@Injectable()
export class SnapshotsService {
  constructor(
    @InjectModel(Snapshot.name)
    private snapshotModel: Model<Snapshot>,
    @InjectModel(Planter.name)
    private planterModel: Model<Planter>,
    private httpService: HttpService,
    private controlService: ControlService,
  ) {}
  private readonly logger = new Logger(SnapshotsService.name);

  async findAll(): Promise<Snapshot[]> {
    return this.snapshotModel.find().exec();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async createSnapshotsPeriodically() {
    this.logger.debug('Call create Snapshot every 1 hours');
    const plantersIncludeCam = (await this.planterModel.find({})).filter(
      (planter) => planter.cameras.length > 0,
    );
    this.logger.debug(plantersIncludeCam.length);

    // promise.all 로 수정
    if (plantersIncludeCam) {
      for (const planter of plantersIncludeCam) {
        await this.controlService.turnOn(planter.id, false);
        // How to get data from planter
        this.logger.debug(planter);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));

      for (const planter of plantersIncludeCam) {
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
          const current = new Date();
          current.setHours(current.getHours() + 9);

          snapshot.createdAt = current;
          const imageName = `${cam.cameraId}_${current.getTime()}`;
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

      for (const planter of plantersIncludeCam) {
        await this.controlService.turnOff(planter.id, true);
        // How to get data from planter
        this.logger.debug(planter);
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
      path.join(__dirname, '..', '..', 'images', `${fileName}.jpeg`),
    );
    const response: AxiosResponse = await this.httpService.axiosRef({
      url: cameraURL + '/capture',
      method: 'GET',
      responseType: 'stream',
    });
    // await response.data.pipe(transformer).pipe(writeStream);

    for await (const chunk of response.data.pipe(transformer)) {
      if (!writeStream.write(chunk)) {
        // (B)
        // Handle backpressure
        await once(writeStream, 'drain');
      }
    }
    writeStream.end();

    // const result = await new Promise((resolve, reject) => {
    //   console.log(path.join('.', 'images', `${fileName}.jpeg`));
    //   PythonShell.run(
    //     path.join('.', 'python', 'get_pixel.py'),
    //     { args: [path.join('.', 'images', `${fileName}.jpeg`)] },
    //     (err, results) => {
    //       if (err) return reject(err);
    //       return resolve(results);
    //     },
    //   );
    // });
    const {
      success,
      err = '',
      results,
    } = await new Promise((resolve, reject) => {
      PythonShell.run(
        path.join(__dirname, '..', '..', 'python', 'get_pixel.py'),
        {
          args: [
            path.join(__dirname, '..', '..', 'images', `${fileName}.jpeg`),
          ],
        },
        function (err, results) {
          if (err) {
            reject({ success: false, err });
          }
          resolve({ success: true, results });
        },
      );
    });
    if (success) {
      console.log(results);
      return parseInt(results[0]);
    } else {
      return -1;
    }
  }
}
