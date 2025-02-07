import {
  ApplicationCommandDataResolvable,
  Client,
  CommandInteraction,
} from "discord.js";
import * as dotenv from "dotenv";
import { Command } from "./Command"; // [`Command`](src/core/command/Command.ts)
import { readdirSync } from "fs";
import { join } from "path";

dotenv.config();

export class CommandHandler {
  private client: Client;
  private commands: Command[] = [];

  constructor(client: Client) {
    this.client = client;
    this.registerCommands().then(() => this.deployCommands());

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isCommand()) {
        return;
      }

      try {
        await this.handleCommand(interaction);
      } catch (error) {
        console.error("Fehler beim Ausführen eines Commands:", error);
        await interaction.reply({
          content: "Es gab einen Fehler bei der Ausführung des Commands.",
          ephemeral: true,
        });
      }
    });
  }

  public getCommands(): Command[] {
    return this.commands;
  }

  public async deployCommands() {
    const guildCommands: ApplicationCommandDataResolvable[] = this.commands.map(
      (command) => {
        return command.builder.toJSON();
      },
    );
    const guild = this.client.guilds.cache.get(process.env.GUILD!);
    if (guild) {
      await guild.commands.set(guildCommands);
      console.log("Commands successfully deployed.");
    } else {
      console.error("Guild not found.");
    }
  }

  private async registerCommands() {
    const commandFiles = readdirSync(join(__dirname, "../../commands")) // [src/commands](src/commands/)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of commandFiles) {
      try {
        const commandModule = await import(
          join(__dirname, "../../commands", file)
        ); // [src/commands/{file}](src/commands/{file})
        const CommandClass = Object.values(commandModule)[0] as {
          new (): Command;
        };

        if (!CommandClass) {
          console.warn(`No command class found in file: ${file}`);
          continue;
        }

        const commandInstance = new CommandClass();

        if (
          !commandInstance.name ||
          !commandInstance.builder ||
          !commandInstance.execute
        ) {
          console.warn(
            `The command at ${file} is missing required properties.`,
          );
          continue;
        }

        this.commands.push(commandInstance);
      } catch (error) {
        console.error(`Fehler beim Laden des Command-Files ${file}:`, error);
      }
    }

    if (this.commands.length === 0) {
      console.warn("No commands were found or loaded.");
    } else {
      console.log(`${this.commands.length} commands successfully registered.`);
    }
  }

  private async handleCommand(interaction: CommandInteraction): Promise<void> {
    const command = this.commands.find(
      (cmd) => cmd.name === interaction.commandName,
    );
    if (!command) {
      console.warn(`No command found matching: ${interaction.commandName}`);
      return;
    }

    await command.execute(interaction);
  }
}
