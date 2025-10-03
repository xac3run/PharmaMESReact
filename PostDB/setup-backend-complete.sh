#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Nobilis Backend Complete Setup ===${NC}"

# Создаём структуру
mkdir -p backend/src/auth/{guards,strategies,decorators,dto}
mkdir -p backend/src/users/dto

# tsconfig.json
cat > backend/tsconfig.json <<'EOF'
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
    "noFallthroughCasesInSwitch": false,
    "strictPropertyInitialization": false
  }
}
EOF

# nest-cli.json
cat > backend/nest-cli.json <<'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
EOF

# users.service.ts (ИСПРАВЛЕННЫЙ)
cat > backend/src/users/users.service.ts <<'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users.entity';
import { Certification } from './certification.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Certification)
    private certsRepository: Repository<Certification>,
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

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      passwordHash: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.password) {
      updateUserDto['passwordHash'] = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async addCertification(userId: string, certData: any): Promise<Certification> {
    const cert = this.certsRepository.create({ userId, ...certData });
    return this.certsRepository.save(cert);
  }
}
EOF

echo -e "${GREEN}✅ Файлы созданы!${NC}"
echo -e "${YELLOW}Запустите: sudo docker compose up -d --build${NC}"
EOF

chmod +x setup-backend-complete.sh
./setup-backend-complete.sh
