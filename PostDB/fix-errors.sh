#!/bin/bash

echo "Fixing TypeScript errors in users.service.ts..."

cat > backend/src/users/users.service.ts << 'ENDFILE'
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

echo "Fixed! The service should recompile automatically."
EOF
