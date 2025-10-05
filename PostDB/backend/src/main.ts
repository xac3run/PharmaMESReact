import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // API Prefix
  const apiPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Nobilis MES API')
    .setDescription('Manufacturing Execution System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,       // сохраняет токен после ввода
      docExpansion: 'none',             // сворачивает все эндпоинты по умолчанию
      defaultModelsExpandDepth: -1,     // убирает лишние модели
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://77.233.212.181:${port}`);  // меняете localhost
console.log(`📌 API endpoint: http://77.233.212.181:${port}/${apiPrefix}`);  // меняете localhost
console.log(`📖 Swagger docs: http://77.233.212.181:${port}/swagger`);  // меняете localhost
}
bootstrap();
