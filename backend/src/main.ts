import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Configure Validation (Kugira ngo amakuru yinjira abe meza)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 2. Kosora CORS (Ibi nibyo bikemura ya error y'umutuku muri Browser)
  app.enableCors({
    origin: '*', // Emerera ama-requests yose (Professional for testing)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Shyiraho Prefix y'umushinga (Niba uyikoresha muri Frontend)
  app.setGlobalPrefix('api');

  // 4. Tegeka app kwakira requests kuri 0.0.0.0 (Ingenzi kuri Render/Linux)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on port: ${port}`);
}
bootstrap();
