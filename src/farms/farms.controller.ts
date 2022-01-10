import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { Serialize } from 'src/intercepters/serialize.interceptor';
import { User, UserDocument } from 'src/schemas/user.schema';
import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { FarmsService } from './farms.service';

@Controller('farms')
export class FarmsController {
  constructor(private farmsService: FarmsService) {}
  @Post()
  createFarm(@Body() body: CreateFarmDto, @CurrentUser() user: UserDocument) {
    return this.farmsService.create(body, user);
  }

  @Patch('/:id')
  updateFarm(@Param('id') id: ObjectId, @Body() body: UpdateFarmDto) {
    return this.farmsService.update(id, body);
  }
}
