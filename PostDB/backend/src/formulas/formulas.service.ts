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

    // Отделяем BOM от остальных полей
    const { bom, ...formulaFields } = updateFormulaDto;

   // Update formula fields (без BOM)
      Object.assign(formula, formulaFields);
      await this.formulasRepository.save(formula);

    // Update BOM ТОЛЬКО если BOM данные переданы
      if (bom !== undefined) {
    // Remove existing BOM items
      await this.bomRepository.delete({ formulaId: id });
      
      // Create new BOM items if any provided
      if (bom.length > 0) {
      const bomItems = bom.map(bomItem => 
        this.bomRepository.create({
          materialArticle: bomItem.materialArticle,
          quantity: bomItem.quantity,
          unit: bomItem.unit,
          minQuantity: bomItem.minQuantity,
          maxQuantity: bomItem.maxQuantity,
          materialType: bomItem.materialType,
          formulaId: id  // Явно устанавливаем formula_id
        })
      );
        console.log('Creating BOM items:', bomItems); // Для отладки
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
