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
