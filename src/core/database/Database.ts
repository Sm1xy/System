import { Db, MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import Logger from "../../util/logger";
import client from "../../bot";

dotenv.config();

const databaseName = process.env.DB_NAME!;
const uri = process.env.MONGODB_URI!;
const mongoClient = new MongoClient(uri);

let database: Db;

const logger = new Logger(client);

export async function connectDatabase(): Promise<Db> {
  if (database) {
    return database;
  }

  try {
    await mongoClient.connect();
    database = mongoClient.db(databaseName);
    logger.info(`Connected to MongoDB database: ${databaseName}`);

    const admin = mongoClient.db().admin();
    const dbList = await admin.listDatabases();
    const dbExists = dbList.databases.some((db) => db.name === databaseName);

    if (!dbExists) {
      await database.createCollection("Users");
      logger.info(
        `Database '${databaseName}' did not exist and was created with an initial collection.`,
      );
    } else {
      logger.info(`Database '${databaseName}' already exists.`);
    }

    return database;
  } catch (error) {
    logger.error("Failed to connect to MongoDB", error);
    throw error;
  }
}
