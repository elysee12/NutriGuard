import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 0. Enable cookie parser for session management
  app.use(cookieParser());
  
  // 1. Configure Validation (Kugira ngo amakuru yinjira abe meza)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 2. Kosora CORS (Ibi nibyo bikemura ya error y'umutuku muri Browser)
  app.enableCors({
    origin: [
      'https://nutriguard-frontend.onrender.com',
      'http://localhost:5173', // Local Vite development
      'http://localhost:8080', // Alternative local port
      'http://localhost:8081', // New local development port
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Important for cookies
  });

  // 3. Tegeka app kwakira requests kuri 0.0.0.0 (Ingenzi kuri Render/Linux)
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on port: ${port}`);
}
bootstrap();
