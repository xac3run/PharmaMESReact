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
