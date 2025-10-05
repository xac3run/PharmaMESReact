import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateFormulaBomDto {
  @IsString()
  materialArticle: string;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string = 'mg';

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  minQuantity?: number = 0;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
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

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
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

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
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