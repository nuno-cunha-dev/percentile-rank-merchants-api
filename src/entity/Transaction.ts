import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Transaction {
@PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  date: Date;

  @Column()
  amount: number;

  @Column()
  description: string;

  @Column()
  merchantId: number;
}