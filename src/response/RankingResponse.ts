import UserSpendingRank from "../dto/UserSpendingRank";

export default interface RankingResponse {
    merchants: UserSpendingRank[] | unknown[];
}