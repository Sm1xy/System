import { Events, Client } from "discord.js";
import { Event } from "./Event";

export abstract class UserEvent<T extends any[]> extends Event {
  constructor(name: Events) {
    super(name);
  }

  public abstract execute(client: Client, ...args: T): Promise<void>;

  public listen(client: Client): void {
    client.on(this.name, async (...args: T) => {
      try {
        await this.execute(client, ...args);
      } catch (error) {
        console.error(`Error executing event '${this.name}':`, error);
      }
    });
  }
}
