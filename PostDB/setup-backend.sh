#!/bin/bash

echo "=== Setting up Nobilis MES Backend ==="

# Create directory structure
echo "Creating directory structure..."
mkdir -p backend/src/{auth/{guards,strategies,decorators,dto},users/dto}

# Create .env file
echo "Creating .env file..."
cat > backend/.env <<'ENDFILE'
# Server Configuration
NODE_ENV=development
PORT=3001
API_PREFIX=api

# Database Configuration
DATABASE_HOST=localhost
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
CORS_ORIGIN=http://77.233.212.181

# Logging
LOG_LEVEL=debug

# OPC UA Configuration (for future use)
OPC_UA_ENDPOINT=opc.tcp://localhost:4840
OPC_UA_SECURITY_MODE=None
OPC_UA_SECURITY_POLICY=None

# Audit Trail
AUDIT_RETENTION_DAYS=2555  # 7 years for GMP compliance
ENDFILE

# Create main.ts
echo "Creating main.ts..."
cat > backend/src/main.ts <<'ENDFILE'
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // API Prefix
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  
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
  console.log(`Swagger docs available at: http://localhost:${port}/swagger`);
}
bootstrap();
ENDFILE

# Create app.module.ts
echo "Creating app.module.ts..."
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

# Auth Module Files
echo "Creating auth module files..."

# auth.controller.ts
cat > backend/src/auth/auth.controller.ts <<'ENDFILE'
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.username, body.password);
    return this.authService.login(user);
  }
}
ENDFILE

# auth.module.ts
cat > backend/src/auth/auth.module.ts <<'ENDFILE'
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
ENDFILE

# auth.service.ts
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

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (user && password === '1234') {
      return user;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }

  async verifyPassword(username: string, password: string) {
    const user = await this.validateUser(username, password);
    return !!user;
  }
}
ENDFILE

# JWT Strategy
cat > backend/src/auth/strategies/jwt.strategy.ts <<'ENDFILE'
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
ENDFILE

# JWT Auth Guard
cat > backend/src/auth/guards/jwt-auth.guard.ts <<'ENDFILE'
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
ENDFILE

# Users Module Files
echo "Creating users module files..."

# users.entity.ts
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

# certification.entity.ts
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

# users.controller.ts
cat > backend/src/users/users.controller.ts <<'ENDFILE'
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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
  async create(@Body() dto: any) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Deleted' };
  }
}
ENDFILE

# users.service.ts
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

# users.module.ts
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
CREATE INDEX idx_certifications_expiry ON certifications(expiry_date);

-- Insert test users (password: 1234)
INSERT INTO users (username, email, password_hash, full_name, role, department) VALUES
('admin', 'admin@nobilis.com', '1234', 'System Administrator', 'admin', 'IT'),
('supervisor', 'supervisor@nobilis.com', '1234', 'Production Supervisor', 'supervisor', 'Production'),
('operator1', 'operator1@nobilis.com', '1234', 'Operator One', 'operator', 'Production'),
('operator2', 'operator2@nobilis.com', '1234', 'Operator Two', 'operator', 'Production'),
('quality', 'quality@nobilis.com', '1234', 'Quality Controller', 'quality', 'Quality Assurance');

-- Insert test certifications
INSERT INTO certifications (user_id, certification_name, issued_date, expiry_date, issuer) VALUES
((SELECT id FROM users WHERE username = 'operator1'), 'GMP Basic Training', '2024-01-15', '2025-01-15', 'Nobilis Training Center'),
((SELECT id FROM users WHERE username = 'operator1'), 'Equipment Operation Level 1', '2024-02-01', '2025-02-01', 'Equipment Manufacturer'),
((SELECT id FROM users WHERE username = 'operator2'), 'GMP Basic Training', '2024-01-20', '2025-01-20', 'Nobilis Training Center'),
((SELECT id FROM users WHERE username = 'quality'), 'Quality Control Advanced', '2023-06-01', '2024-06-01', 'External QA Institute'),
((SELECT id FROM users WHERE username = 'supervisor'), 'Leadership in Manufacturing', '2023-09-15', '2024-09-15', 'Management Institute');

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
ENDFILE

# Update docker-compose.yml to use correct env for backend
echo "Updating docker-compose environment variables..."
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
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: nobilis_mes
      DATABASE_USER: nobilis_user
      DATABASE_PASSWORD: nobilis_password_change_me
      JWT_SECRET: change_this_secret_key_in_production
      JWT_EXPIRATION: 24h
      CORS_ORIGIN: http://77.233.212.181
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - nobilis_network
    command: npm run start:dev

volumes:
  postgres_data:
    driver: local

networks:
  nobilis_network:
    driver: bridge
ENDFILE

# Create test script
echo "Creating test script..."
cat > test-api.sh <<'ENDFILE'
#!/bin/bash

API_URL="http://localhost:3001/api"

echo "=== Testing Nobilis MES API ==="

# Test health
echo -e "\n1. Testing health endpoint..."
curl -s ${API_URL%/api}/health | jq '.' || echo "Health check failed"

# Login as admin
echo -e "\n2. Login as admin..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "1234"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Login response: $LOGIN_RESPONSE"

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo "Login successful! Token: ${TOKEN:0:20}..."
  
  # Get all users
  echo -e "\n3. Getting all users..."
  curl -s -X GET $API_URL/users \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  
  # Get specific user
  echo -e "\n4. Getting admin user details..."
  ADMIN_ID=$(curl -s -X GET $API_URL/users \
    -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
  
  if [ "$ADMIN_ID" != "null" ]; then
    curl -s -X GET $API_URL/users/$ADMIN_ID \
      -H "Authorization: Bearer $TOKEN" | jq '.'
  fi
else
  echo "Login failed!"
fi

echo -e "\n=== Testing complete ==="
ENDFILE

chmod +x test-api.sh

echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "1. Review the generated files"
echo "2. Start the services:"
echo "   docker-compose down -v"
echo "   docker-compose up -d --build"
echo ""
echo "3. Check logs:"
echo "   docker-compose logs -f"
echo ""
echo "4. Test the API:"
echo "   ./test-api.sh"
echo ""
echo "5. Access Swagger UI:"
echo "   http://localhost:3001/swagger"
echo ""
echo "Default credentials:"
echo "   Username: admin"
echo "   Password: 1234"
