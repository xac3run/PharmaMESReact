"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const users_entity_1 = require("./users.entity");
const certification_entity_1 = require("./certification.entity");
let UsersService = class UsersService {
    constructor(usersRepository, certsRepository) {
        this.usersRepository = usersRepository;
        this.certsRepository = certsRepository;
    }
    async findAll() {
        return this.usersRepository.find({ relations: ['certifications'] });
    }
    async findOne(id) {
        const user = await this.usersRepository.findOne({ where: { id }, relations: ['certifications'] });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async findByUsername(username) {
        return this.usersRepository.findOne({ where: { username }, relations: ['certifications'] });
    }
    async create(dto) {
        const user = this.usersRepository.create(dto);
        return this.usersRepository.save(user);
    }
    async update(id, dto) {
        const user = await this.findOne(id);
        Object.assign(user, dto);
        return this.usersRepository.save(user);
    }
    async remove(id) {
        const user = await this.findOne(id);
        await this.usersRepository.remove(user);
    }
    async addCertification(userId, data) {
        const cert = this.certsRepository.create({ userId, ...data });
        return this.certsRepository.save(cert);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(certification_entity_1.Certification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
