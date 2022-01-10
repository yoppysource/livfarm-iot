import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose/dist/common';
import { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import { lastValueFrom, map } from 'rxjs';
import { Planter } from 'src/schemas/planter.schema';

// This service is responsible for controlling planter in cloud setting
@Injectable()
export class ControlService {
  constructor(
    private httpService: HttpService,
    @InjectModel(Planter.name)
    private planterModel: Model<Planter>,
  ) {}

  async turnOn(id: string, forceTo: boolean) {
    const planter = await this.planterModel.findById(id);
    if (!planter) throw new NotFoundException('존재하지 않는 Planter입니다.');
    if (!forceTo && planter.setting.turnOn != planter.setting.turnOff) {
      const [onHour, onMin] = planter.setting.turnOn.split(':');
      const turnOnTimeToMin = parseInt(onHour) * 60 + parseInt(onMin);
      const [offHour, offMin] = planter.setting.turnOff.split(':');
      const turnOffTimeToMin = parseInt(offHour) * 60 + parseInt(offMin);
      const now = new Date();
      const nowHourToMin = now.getHours() * 60 + now.getMinutes();

      if (turnOnTimeToMin < turnOffTimeToMin) {
        if (turnOnTimeToMin < nowHourToMin && turnOffTimeToMin > nowHourToMin)
          return 200;
      } else {
        if (turnOnTimeToMin < nowHourToMin || turnOffTimeToMin > nowHourToMin)
          return 200;
      }
    }
    const res: AxiosResponse = await lastValueFrom(
      this.httpService.get(planter.getUrl(['turnOn'])),
    );
    return res.status;
  }

  async turnOff(id: string) {
    const planter = await this.planterModel.findById(id);
    if (!planter) throw new NotFoundException('존재하지 않는 Planter입니다.');
    const res: AxiosResponse = await lastValueFrom(
      this.httpService.get(planter.getUrl(['turnOff'])),
    );
    return res.status;
  }
}
