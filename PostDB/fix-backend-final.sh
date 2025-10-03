#!/bin/bash
echo "Fixing backend..."
rm -rf backend/src
mkdir -p backend/src/auth/{guards,strategies,decorators,dto}
mkdir -p backend/src/users/dto

cat > backend/tsconfig.json <<'ENDFILE'
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "outDir": "./dist",
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictPropertyInitialization": false,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
ENDFILE

cat > backend/src/app.module.ts <<'ENDFILE'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
ENDFILE

cat > backend/src/auth/auth.controller.ts <<'ENDFILE'
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.username, body.password);
    return this.authService.login(user);
  }
}
ENDFILE

cat > backend/src/users/users.service.ts <<'ENDFILE'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { Certification } from './certification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Certification) private certsRepository: Repository<Certification>,
  ) {}

  async findAll() {
    return this.usersRepository.find({ relations: ['certifications'] });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['certifications'] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username }, relations: ['certifications'] });
  }

  async create(dto: any) {
    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }

  async update(id: string, dto: any) {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async addCertification(userId: string, data: any) {
    const cert = this.certsRepository.create({ userId, ...data });
    return this.certsRepository.save(cert);
  }
}
ENDFILE

cat > backend/src/users/users.controller.ts <<'ENDFILE'
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Deleted' };
  }
}
ENDFILE

echo "Done! Run: sudo docker compose up -d --build"
