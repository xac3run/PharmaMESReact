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
