import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

process.env.TZ = 'Asia/Seoul';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:8081', 'http://127.0.0.1:8081'],
  });
  await app.listen(port);
}
bootstrap();
