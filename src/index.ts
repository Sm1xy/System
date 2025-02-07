import { CommandHandler } from "./core/command/CommandHandler";
import { EventHandler } from "./core/event/EventHandler";
import { login } from "./bot";
import Logger from "./util/logger";
import "./util/MessageLogger";
import "./modules/level/LevelSystem";
import { connectDatabase } from "./core/database/Database";
import { LevelSystem } from "./modules/level/LevelSystem";
import { GiveawayHandler } from "./modules/giveaways/GiveawayHandler";
import { TicketSystem } from "./modules/tickets/TicketSystem";
import VoiceSystem from "./modules/voice/VoiceSystem";
import CounterChannel from "./modules/miscellaneous/CounterChannel";

login()
  .then(async (clientInstance) => {
    const logger = new Logger(clientInstance);

    try {
      await connectDatabase();
      logger.info("Database connection established successfully.", true);
    } catch (error) {
      logger.error("Failed to connect to the database.", error);
      process.exit(1);
    }

    const eventHandler = new EventHandler(clientInstance);
    await eventHandler.deployEvents();
    logger.log(`${eventHandler.getEvents().length} Events were loaded!`, true);

    const commandHandler = new CommandHandler(clientInstance);
    await commandHandler.deployCommands();
    logger.log(
      `${commandHandler.getCommands().length} Commands were loaded!`,
      true,
    );

    const levelSystem = new LevelSystem(clientInstance);
    logger.info("Level system initialized.", true);

    GiveawayHandler.initialize(clientInstance);
    logger.info("Giveaway system initialized.", true);

    TicketSystem.init(clientInstance);
    logger.info("Ticket system initialized.", true);

    const voiceSystem = VoiceSystem.getInstance(clientInstance, logger);
    logger.info("Voice system initialized.", true);

    const counterChannel = new CounterChannel(clientInstance, logger);
    logger.info("Counter channel system initialized.", true);
  })
  .catch((error) => {
    console.error("Error logging in the bot", error);
  });

process.on("uncaughtException", function (err) {
  const text = "[-] Caught exception: " + err + "\n" + err.stack;
  console.log(text);
});
