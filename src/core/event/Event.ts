import { Client } from "discord.js";

export abstract class Event {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }
  abstract listen(client: Client): void;

  public abstract execute(client: Client, ...args: any[]): Promise<void>;
}
