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
