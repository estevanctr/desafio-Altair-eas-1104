import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { Env } from './env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<Env, true>>(ConfigService);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Processes API')
    .setDescription('API for managing judicial processes and their communications')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));

  await app.listen(configService.get('PORT', { infer: true }));
}
bootstrap();
