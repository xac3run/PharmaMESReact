#!/bin/bash

echo "=== Complete Nobilis MES Backend Setup ==="

# Get current directory
PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# Clean up old files
echo "Cleaning up old files..."
rm -rf backend/node_modules backend/dist backend/package-lock.json
mkdir -p backend/src/{auth/{guards,strategies,decorators,dto},users/dto}

# Create package.json FIRST (this was missing!)
echo "Creating package.json..."
cat > backend/package.json <<'ENDFILE'
{
  "name": "nobilis-mes-backend",
  "version": "1.0.0",
  "description": "Nobilis MES Backend API",
  "author": "Nobilis Team",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/typeorm": "^10.0.1",
    "@nestjs/websockets": "^10.3.0",
    "@nestjs/platform-socket.io": "^10.3.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "dotenv": "^16.3.1",
    "node-opcua": "^2.118.0",
    "winston": "^3.11.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^3.0.13",
    "@types/passport-local": "^1.0.38",
    "@types/bcrypt": "^5.0.2",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
ENDFILE

# Create tsconfig.json
echo "Creating tsconfig.json..."
cat > backend/tsconfig.json <<'ENDFILE'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
ENDFILE

# Create tsconfig.build.json
echo "Creating tsconfig.build.json..."
cat > backend/tsconfig.build.json <<'ENDFILE'
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
ENDFILE

# Create nest-cli.json
echo "Creating nest-cli.json..."
cat > backend/nest-cli.json <<'ENDFILE'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
ENDFILE

# Create .env file in backend directory
echo "Creating .env file..."
cat > backend/.env <<'ENDFILE'
# Server Configuration
NODE_ENV=development
PORT=3001
API_PREFIX=api

# Database Configuration
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=nobilis_mes
DATABASE_USER=nobilis_user
DATABASE_PASSWORD=nobilis_password_change_me

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=your_refresh_token_secret_change_this
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
ENDFILE

# Create Dockerfile
echo "Creating Dockerfile..."
cat > backend/Dockerfile <<'ENDFILE'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build the application (optional for dev)
# RUN npm run build

# Expose port
EXPOSE 3001

# Start in development mode
CMD ["npm", "run", "start:dev"]
ENDFILE

# Create main.ts
echo "Creating src/main.ts..."
cat > backend/src/main.ts <<'ENDFILE'
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
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
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
  SwaggerModule.setup('swagger', app, document);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API endpoint: http://localhost:${port}/${apiPrefix}`);
  console.log(`Swagger docs: http://localhost:${port}/swagger`);
}
bootstrap();
ENDFILE

# Create app.module.ts
echo "Creating src/app.module.ts..."
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
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
ENDFILE

# Create Auth module files
echo "Creating auth module..."

cat > backend/src/auth/auth.module.ts <<'ENDFILE'
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'secret-key',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
ENDFILE

cat > backend/src/auth/auth.controller.ts <<'ENDFILE'
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(@Body() loginDto: { username: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    return this.authService.login(user);
  }
}
ENDFILE

cat > backend/src/auth/auth.service.ts <<'ENDFILE'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    // Simple password check - in production use bcrypt
    if (user && user.passwordHash === password) {
      const { passwordHash, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
ENDFILE

cat > backend/src/auth/strategies/jwt.strategy.ts <<'ENDFILE'
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'secret-key',
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}
ENDFILE

cat > backend/src/auth/guards/jwt-auth.guard.ts <<'ENDFILE'
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
ENDFILE

# Create Users module files
echo "Creating users module..."

cat > backend/src/users/users.module.ts <<'ENDFILE'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Certification } from './certification.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Certification])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
ENDFILE

cat > backend/src/users/users.entity.ts <<'ENDFILE'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Certification } from './certification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  department: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'last_training_date', type: 'date', nullable: true })
  lastTrainingDate: Date;

  @OneToMany(() => Certification, cert => cert.user)
  certifications: Certification[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
ENDFILE

cat > backend/src/users/certification.entity.ts <<'ENDFILE'
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './users.entity';

@Entity('certifications')
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.certifications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'certification_name' })
  certificationName: string;

  @Column({ name: 'issued_date', type: 'date' })
  issuedDate: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  issuer: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
ENDFILE

cat > backend/src/users/users.controller.ts <<'ENDFILE'
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  async create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @Post(':id/certifications')
  @ApiOperation({ summary: 'Add certification to user' })
  async addCertification(@Param('id') userId: string, @Body() certificationDto: any) {
    return this.usersService.addCertification(userId, certificationDto);
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
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Certification)
    private certificationsRepository: Repository<Certification>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['certifications'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['certifications'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
      relations: ['certifications'],
    });
  }

  async create(createUserDto: any): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async addCertification(userId: string, certificationData: any): Promise<Certification> {
    const user = await this.findOne(userId);
    const certification = this.certificationsRepository.create({
      ...certificationData,
      userId: user.id,
    });
    return this.certificationsRepository.save(certification);
  }
}
ENDFILE

# Create docker-compose.yml in project root
echo "Creating docker-compose.yml..."
cat > docker-compose.yml <<'ENDFILE'
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg15
    container_name: nobilis_postgres
    restart: always
    environment:
      POSTGRES_DB: nobilis_mes
      POSTGRES_USER: nobilis_user
      POSTGRES_PASSWORD: nobilis_password_change_me
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - nobilis_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nobilis_user -d nobilis_mes"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: nobilis_backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: development
      PORT: 3001
      API_PREFIX: api
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: nobilis_mes
      DATABASE_USER: nobilis_user
      DATABASE_PASSWORD: nobilis_password_change_me
      JWT_SECRET: your_jwt_secret_key_change_this_in_production
      JWT_EXPIRATION: 24h
      CORS_ORIGIN: "*"
    ports:
      - "3001:3001"
    volumes:
      - ./backend/src:/app/src
      - ./backend/package.json:/app/package.json
      - ./backend/tsconfig.json:/app/tsconfig.json
    networks:
      - nobilis_network

volumes:
  postgres_data:
    driver: local

networks:
  nobilis_network:
    driver: bridge
ENDFILE

# Create schema.sql
echo "Creating schema.sql..."
cat > schema.sql <<'ENDFILE'
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if exist (for clean start)
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    last_training_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Certifications table
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certification_name VARCHAR(200) NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE,
    issuer VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_certifications_user_id ON certifications(user_id);

-- Insert test users (password: 1234)
INSERT INTO users (username, email, password_hash, full_name, role, department) VALUES
('admin', 'admin@nobilis.com', '1234', 'System Administrator', 'admin', 'IT'),
('supervisor', 'supervisor@nobilis.com', '1234', 'Production Supervisor', 'supervisor', 'Production'),
('operator1', 'operator1@nobilis.com', '1234', 'Machine Operator', 'operator', 'Production');

-- Insert test certifications
INSERT INTO certifications (user_id, certification_name, issued_date, expiry_date, issuer) VALUES
((SELECT id FROM users WHERE username = 'operator1'), 'GMP Basic Training', '2024-01-15', '2025-01-15', 'Nobilis Training Center');
ENDFILE

# Create test script
echo "Creating test-api.sh..."
cat > test-api.sh <<'ENDFILE'
#!/bin/bash

API_URL="http://localhost:3001/api"

echo "=== Testing Nobilis MES API ==="

# Test health/root
echo -e "\n1. Testing API root..."
curl -s http://localhost:3001/ || echo "Root endpoint not available"

# Login
echo -e "\n2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "1234"}')

echo "Login response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ ! -z "$TOKEN" ]; then
  echo -e "\nLogin successful! Token received."
  
  # Get users
  echo -e "\n3. Getting all users..."
  curl -s -X GET $API_URL/users \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" | python3 -m json.tool
else
  echo "Login failed! Check your backend logs."
fi

echo -e "\n=== Test complete ==="
echo "Swagger UI available at: http://localhost:3001/swagger"
ENDFILE

chmod +x test-api.sh

# Create .gitignore
echo "Creating .gitignore..."
cat > backend/.gitignore <<'ENDFILE'
# Dependencies
node_modules/

# Build output
dist/

# Environment files
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Temp files
*.tmp
*.swp
ENDFILE

echo "=== Setup Complete! ==="
echo ""
echo "Project structure created. Now run:"
echo ""
echo "1. Clean up and rebuild:"
echo "   sudo docker-compose down -v"
echo "   sudo docker-compose up --build"
echo ""
echo "2. In another terminal, check logs:"
echo "   sudo docker-compose logs -f"
echo ""
echo "3. Test the API (wait for backend to start):"
echo "   ./test-api.sh"
echo ""
echo "4. Access Swagger UI:"
echo "   http://localhost:3001/swagger"
echo ""
echo "Default credentials: admin / 1234"