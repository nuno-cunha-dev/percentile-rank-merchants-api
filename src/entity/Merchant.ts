import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Merchant {
@PrimaryGeneratedColumn()
  id: number;

  @Column()
  displayName: string;

  @Column()
  iconUrl: string;

  @Column()
  funnyGitUrl: string;
}