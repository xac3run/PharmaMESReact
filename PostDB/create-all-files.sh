#!/bin/bash
echo "Creating ALL backend files..."

# auth.module.ts
cat > backend/src/auth/auth.module.ts <<'END'
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
END

# auth.service.ts
cat > backend/src/auth/auth.service.ts <<'END'
import { Injectable } from '@nestjs/common';
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
    return null;
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
END

# jwt.strategy.ts
cat > backend/src/auth/strategies/jwt.strategy.ts <<'END'
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
END

# jwt-auth.guard.ts
cat > backend/src/auth/guards/jwt-auth.guard.ts <<'END'
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
END

# users.module.ts
cat > backend/src/users/users.module.ts <<'END'
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
END

# users.entity.ts
cat > backend/src/users/users.entity.ts <<'END'
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
END

# certification.entity.ts
cat > backend/src/users/certification.entity.ts <<'END'
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
END

echo "Done! Run: sudo docker compose up -d --build"
