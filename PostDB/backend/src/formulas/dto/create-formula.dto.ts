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
