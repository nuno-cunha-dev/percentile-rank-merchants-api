import { EntityRepository, Repository } from "typeorm";
import UserTotalAmountPerMerchant from "../dto/UserTotalAmountPerMerchant";
import { Transaction } from "../entity/Transaction";

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction> {
  public findUserTotalAmountPerMerchant(from: string, to: string): Promise<UserTotalAmountPerMerchant[]> {
    return this.createQueryBuilder('t')
        .select('user_id', 'userId')
        .addSelect('merchant_id', 'merchantId')
        .addSelect('sum(amount)', 'total')
        .where('t.date >= :initDate', { initDate: from })
        .andWhere('t.date < :endDate', { endDate: to })
        .groupBy('user_id')
        .addGroupBy('merchant_id')
        .getRawMany();
  }
}
