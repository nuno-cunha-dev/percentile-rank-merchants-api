import { EntityManager } from "typeorm";
import { entityManager, redis, RedisClient } from "zents";
import UserSpendingRank from "../dto/UserSpendingRank";
import MerchantTransactionGroup from "../dto/MerchantTransactionGroup";
import UserTotalAmountPerMerchant from "../dto/UserTotalAmountPerMerchant";
import { TransactionRepository } from "../repository/TransactionRepository";
import RankingRequest from "../request/RankingRequest";
import UserPercentileResult from "../dto/UserPercentilResult";
import { Merchant } from "../entity/Merchant";

type MerchantTransactionGroups = Array<Array<MerchantTransactionGroup> | null>;
type UserPercentileResults = Array<Array<UserPercentileResult> | null>;

export default class {
  @redis
  protected redis: RedisClient;

  @entityManager
  protected entityManager: EntityManager;

  public async getRanking(rankingRequest: RankingRequest): Promise<UserSpendingRank[] | unknown[]> {
    const { userId, from, to } = rankingRequest;
    console.log("[Redis][key]: " + this.buildKey(String(userId), from, to));
    const result = await this.redis.get(this.buildKey(String(userId), from, to));
    console.log("[Redis][get]: " + result);
    if (!result) {
      return [];
    }

    const userPercentileResults: UserPercentileResult[] = JSON.parse(result);
    return this.buildCustomerSpendingRank(userPercentileResults);
  }

  public async generateSpendingRanking(from: string, to: string): Promise<void> {
    const transactionRepository = this.entityManager.getCustomRepository(TransactionRepository);
    try {
      console.log("Fetching DB");
      const userTotalAmountPerMerchantResult = await transactionRepository.findUserTotalAmountPerMerchant(from, to);
      console.log("Grouping by merchant");
      const merchantTransactionGroups = this.groupByMerchantTransactions(userTotalAmountPerMerchantResult);
      console.log("Calculating percentil");
      const userPercentileResults = this.calculatePercentilByUser(merchantTransactionGroups);
      console.log("Save in cache");
      this.saveUserCalculatedPercentileInCache(userPercentileResults, from, to);
    } catch (e) {
      console.log(e);
    }
  }

  private groupByMerchantTransactions(
    userTotalAmountPerMerchantResult: UserTotalAmountPerMerchant[]
  ): MerchantTransactionGroups {
    var merchantTransactionGroups: MerchantTransactionGroups = [];

    userTotalAmountPerMerchantResult.forEach((userTotalAmountPerMerchant) => {
      if (merchantTransactionGroups[userTotalAmountPerMerchant.merchantId] === undefined) {
        merchantTransactionGroups[userTotalAmountPerMerchant.merchantId] = [
          {
            userId: userTotalAmountPerMerchant.userId,
            total: userTotalAmountPerMerchant.total,
          },
        ];
      } else {
        merchantTransactionGroups[userTotalAmountPerMerchant.merchantId].push({
          userId: userTotalAmountPerMerchant.userId,
          total: userTotalAmountPerMerchant.total,
        });
      }
    });

    return merchantTransactionGroups;
  }

  private calculatePercentilByUser(merchantTransactionGroups: MerchantTransactionGroups) {
    var result: UserPercentileResults = [];

    for (var merchantId in merchantTransactionGroups) {
      const merchantTransactionGroup = merchantTransactionGroups[merchantId];
      if (merchantTransactionGroup === null) return;

      merchantTransactionGroup.forEach((userTotalTransactionObject) => {
        var isOverCounter = 0;

        merchantTransactionGroup.forEach((userTotalTransactionObjectSearch) => {
          if (userTotalTransactionObjectSearch.userId === userTotalTransactionObject.userId) return;

          if (userTotalTransactionObjectSearch.total < userTotalTransactionObject.total) isOverCounter++;
        });

        var userPercentileResult: UserPercentileResult = {
          merchantId: Number(merchantId),
          percentil: (isOverCounter * 100) / merchantTransactionGroup.length,
        };

        if (result[userTotalTransactionObject.userId] === undefined) {
          result[userTotalTransactionObject.userId] = [userPercentileResult];
        } else {
          result[userTotalTransactionObject.userId].push(userPercentileResult);
        }
      });
    }

    return result;
  }

  private saveUserCalculatedPercentileInCache(
    userPercentileResult: UserPercentileResults,
    from: string,
    to: string
  ): void {
    for (var userId in userPercentileResult) {
      if (userPercentileResult === undefined) return;

      const key = this.buildKey(userId as string, from, to);
      this.redis.set(key, JSON.stringify(userPercentileResult[userId]));
    }
  }

  private buildKey(userId: string, from: string, to: string): string {
    return `${userId}.${from}.${to}`;
  }

  private async buildCustomerSpendingRank(userPercentileResults: UserPercentileResult[]): Promise<UserSpendingRank[]> {
    const merchantIds = userPercentileResults.map((userPercentileResults) => userPercentileResults.merchantId);

    const merchantRepository = this.entityManager.getRepository(Merchant);
    const merchants = await merchantRepository.findByIds(merchantIds);

    return userPercentileResults.map((userPercentileResults) => {
      return {
        name: merchants.find((merchants) => merchants.id === userPercentileResults.merchantId).displayName,
        percentile: userPercentileResults.percentil.toFixed(2),
      };
    });
  }
}
