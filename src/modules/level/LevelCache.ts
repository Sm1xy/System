import { LevelSchema } from "./Level";

export class LevelCache {
  private cache: Map<string, LevelSchema> = new Map();

  get(userId: string): LevelSchema | undefined {
    return this.cache.get(userId);
  }

  set(userId: string, data: LevelSchema): void {
    this.cache.set(userId, data);
  }

  delete(userId: string): void {
    this.cache.delete(userId);
  }

  clear(): void {
    this.cache.clear();
  }
}
