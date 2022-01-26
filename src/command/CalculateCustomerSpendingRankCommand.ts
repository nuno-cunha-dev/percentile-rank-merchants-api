import * as dotenv from "dotenv";
import { loadConfig } from "zents/lib/config";
import { createLogger } from "zents/lib/log";
import { validateInstallation } from "zents/lib/filesystem/validateInstallation";
import { AutoLoader } from "zents/lib/core";
import RankingService from "../service/RankingService";
import yargs from "yargs";

dotenv.config();
(async () => {
  // load args
  const { from, to } = yargs(process.argv.slice(2)).argv as {from?: string, to?: string};

  if (!from || !to) {
    console.log("Missing --from or --to arguments");
    process.exit(0);
  }

  // load zents framework cli mode
  await loadConfig();
  createLogger();
  await validateInstallation();
  const autoloader = new AutoLoader();
  const registry = await autoloader.createRegistry();

  const rankingService: RankingService = registry.factories.service.build<RankingService>("rankingservice");
  await rankingService.generateSpendingRanking(from, to);

  process.exit(0);
})();
