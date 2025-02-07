import { Events, Client } from "discord.js";
import { Event } from "./Event";

export abstract class BaseEvent<T> implements Event {
  abstract name: Events;
  abstract execute(client: Client, interaction: T): Promise<void>;

  listen(client: Client): void {
    const name: string = this.name;
    client.on(name, (args: any) => {
      try {
        this.execute(client, args as T);
      } catch (error) {
        console.error("Fehler beim Ausführen eines Events:", error);
      }
    });
  }
}
