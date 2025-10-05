#!/bin/bash

# Script to create all formulas module files for NestJS backend
# Run this from PostDB/backend/src directory

echo "Creating formulas module structure..."

# Create directories
mkdir -p formulas/dto

# Create formulas.entity.ts
cat > formulas/formulas.entity.ts << 'EOF'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'article_number', unique: true })
  articleNumber: string;

  @Column()
  name: string;

  @Column({ default: 'quarantine' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  quantity: number;

  @Column({ default: 'g' })
  unit: string;

  @Column({ nullable: true })
  location: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ name: 'received_date', type: 'date', nullable: true })
  receivedDate: Date;

  @Column({ nullable: true })
  supplier: string;

  @Column({ name: 'lot_number', nullable: true })
  lotNumber: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('formulas')
export class Formula {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'article_number', unique: true })
  articleNumber: string;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'weight_per_unit', type: 'decimal', precision: 10, scale: 3, default: 0 })
  weightPerUnit: number;

  @Column({ name: 'product_type', default: 'dosing' })
  productType: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ default: '1.0' })
  version: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => FormulaBom, bom => bom.formula, { cascade: true })
  bom: FormulaBom[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('formula_bom')
export class FormulaBom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'formula_id' })
  formulaId: string;

  @ManyToOne(() => Formula, formula => formula.bom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'formula_id' })
  formula: Formula;

  @Column({ name: 'material_article' })
  materialArticle: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ default: 'mg' })
  unit: string;

  @Column({ name: 'min_quantity', type: 'decimal', precision: 10, scale: 3, default: 0 })
  minQuantity: number;

  @Column({ name: 'max_quantity', type: 'decimal', precision: 10, scale: 3, default: 0 })
  maxQuantity: number;

  @Column({ name: 'material_type', default: 'raw_material' })
  materialType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
EOF

# Create dto/create-formula.dto.ts
cat > formulas/dto/create-formula.dto.ts << 'EOF'
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormulaBomDto {
  @IsString()
  materialArticle: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string = 'mg';

  @IsNumber()
  @IsOptional()
  minQuantity?: number = 0;

  @IsNumber()
  @IsOptional()
  maxQuantity?: number = 0;

  @IsString()
  @IsOptional()
  materialType?: string = 'raw_material';
}

export class CreateFormulaDto {
  @IsString()
  articleNumber: string;

  @IsString()
  productName: string;

  @IsNumber()
  @IsOptional()
  weightPerUnit?: number = 0;

  @IsString()
  @IsOptional()
  productType?: string = 'dosing';

  @IsString()
  @IsOptional()
  status?: string = 'draft';

  @IsString()
  @IsOptional()
  version?: string = '1.0';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormulaBomDto)
  @IsOptional()
  bom?: CreateFormulaBomDto[] = [];
}

export class UpdateFormulaDto {
  @IsString()
  @IsOptional()
  articleNumber?: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsNumber()
  @IsOptional()
  weightPerUnit?: number;

  @IsString()
  @IsOptional()
  productType?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormulaBomDto)
  @IsOptional()
  bom?: CreateFormulaBomDto[];
}
EOF

# Create formulas.service.ts
cat > formulas/formulas.service.ts << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formula, FormulaBom, Material } from './formulas.entity';
import { CreateFormulaDto, UpdateFormulaDto } from './dto/create-formula.dto';

@Injectable()
export class FormulasService {
  constructor(
    @InjectRepository(Formula)
    private formulasRepository: Repository<Formula>,
    @InjectRepository(FormulaBom)
    private bomRepository: Repository<FormulaBom>,
    @InjectRepository(Material)
    private materialsRepository: Repository<Material>,
  ) {}

  async findAll(): Promise<Formula[]> {
    return this.formulasRepository.find({
      relations: ['bom', 'creator'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Formula> {
    const formula = await this.formulasRepository.findOne({
      where: { id },
      relations: ['bom', 'creator']
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID ${id} not found`);
    }

    return formula;
  }

  async create(createFormulaDto: CreateFormulaDto, userId?: string): Promise<Formula> {
    const formula = this.formulasRepository.create({
      ...createFormulaDto,
      createdBy: userId
    });

    const savedFormula = await this.formulasRepository.save(formula);

    // Create BOM items if provided
    if (createFormulaDto.bom && createFormulaDto.bom.length > 0) {
      const bomItems = createFormulaDto.bom.map(bomItem => 
        this.bomRepository.create({
          ...bomItem,
          formulaId: savedFormula.id
        })
      );
      await this.bomRepository.save(bomItems);
    }

    return this.findOne(savedFormula.id);
  }

  async update(id: string, updateFormulaDto: UpdateFormulaDto): Promise<Formula> {
    const formula = await this.findOne(id);

    // Update formula fields
    Object.assign(formula, updateFormulaDto);
    await this.formulasRepository.save(formula);

    // Update BOM if provided
    if (updateFormulaDto.bom) {
      // Remove existing BOM items
      await this.bomRepository.delete({ formulaId: id });
      
      // Create new BOM items
      if (updateFormulaDto.bom.length > 0) {
        const bomItems = updateFormulaDto.bom.map(bomItem => 
          this.bomRepository.create({
            ...bomItem,
            formulaId: id
          })
        );
        await this.bomRepository.save(bomItems);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const formula = await this.findOne(id);
    await this.formulasRepository.remove(formula);
  }

  async updateStatus(id: string, status: string): Promise<Formula> {
    const formula = await this.findOne(id);
    formula.status = status;
    await this.formulasRepository.save(formula);
    return this.findOne(id);
  }

  // Materials methods
  async findAllMaterials(): Promise<Material[]> {
    return this.materialsRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findMaterial(id: string): Promise<Material> {
    const material = await this.materialsRepository.findOne({
      where: { id }
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }
}
EOF

# Create formulas.controller.ts
cat > formulas/formulas.controller.ts << 'EOF'
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { FormulasService } from './formulas.service';
import { CreateFormulaDto, UpdateFormulaDto } from './dto/create-formula.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('formulas')
@UseGuards(JwtAuthGuard)
export class FormulasController {
  constructor(private readonly formulasService: FormulasService) {}

  @Post()
  create(@Body() createFormulaDto: CreateFormulaDto, @Request() req) {
    return this.formulasService.create(createFormulaDto, req.user?.userId);
  }

  @Get()
  findAll() {
    return this.formulasService.findAll();
  }

  @Get('materials')
  findAllMaterials() {
    return this.formulasService.findAllMaterials();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formulasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormulaDto: UpdateFormulaDto) {
    return this.formulasService.update(id, updateFormulaDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.formulasService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formulasService.remove(id);
  }
}
EOF

# Create formulas.module.ts
cat > formulas/formulas.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormulasService } from './formulas.service';
import { FormulasController } from './formulas.controller';
import { Formula, FormulaBom, Material } from './formulas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Formula, FormulaBom, Material])],
  controllers: [FormulasController],
  providers: [FormulasService],
  exports: [FormulasService]
})
export class FormulasModule {}
EOF

echo "✅ Formulas module files created successfully!"
echo ""
echo "Created files:"
echo "  - formulas/formulas.entity.ts"
echo "  - formulas/dto/create-formula.dto.ts"
echo "  - formulas/formulas.service.ts"
echo "  - formulas/formulas.controller.ts"
echo "  - formulas/formulas.module.ts"
echo ""
echo "Next steps:"
echo "1. Update your schema.sql with the formulas tables"
echo "2. Add FormulasModule to app.module.ts imports"
echo "3. Restart your backend container"
