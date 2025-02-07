import NodeCache from "node-cache";

class Cache {
  private static instance: Cache;
  public levelsCache: NodeCache;
  public giveawaysCache: NodeCache;

  private constructor() {
    this.levelsCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
    this.giveawaysCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }
}

export default Cache.getInstance();
