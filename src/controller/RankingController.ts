import { Controller, get, inject, query } from "zents";
import RankingRequest from "../request/RankingRequest";
import RankingResponse from "../response/RankingResponse";
import RankingService from "../service/RankingService";

export default class extends Controller {
  @inject
  protected rankingService: RankingService;

  @get("/ranking")
  public async getRanking(@query rankingRequest: RankingRequest): Promise<RankingResponse> {
    return {
      merchants: await this.rankingService.getRanking(rankingRequest),
    };
  }
}
