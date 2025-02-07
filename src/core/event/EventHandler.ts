import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Event } from "./Event";

export class EventHandler {
  private client: Client;
  private events: Event[] = [];

  constructor(client: Client) {
    this.client = client;
    this.registerEvents();
  }

  private registerEvents() {
    const eventsPath = join(__dirname, "../../events");
    const eventFiles = readdirSync(eventsPath).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js"),
    );

    for (const file of eventFiles) {
      import(join(eventsPath, file))
        .then((eventModule) => {
          const EventClass = eventModule[Object.keys(eventModule)[0]];
          if (!EventClass) {
            console.warn(`No event class found in file: ${file}`);
            return;
          }

          const eventInstance: Event = new EventClass();
          this.events.push(eventInstance);
          eventInstance.listen(this.client);
          console.log(`Registered event: ${eventInstance.name}`);
        })
        .catch((error) => {
          console.error(`Error loading event file ${file}:`, error);
        });
    }
  }

  public async deployEvents() {
    for (const event of this.events) {
      console.log(`Deploying event: ${event.name}`);
      event.listen(this.client);
    }
    console.log("All events deployed successfully.");
  }

  public getEvents() {
    return this.events;
  }

  public getEvent(name: string) {
    return this.events.find((event) => event.name === name);
  }
}
