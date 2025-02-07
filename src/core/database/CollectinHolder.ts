import { Collection, Document } from "mongodb";
import { connectDatabase } from "./Database";

export abstract class CollectionHolder<TSchema extends Document = Document> {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  async getCollection(): Promise<Collection<TSchema>> {
    const database = await connectDatabase();
    const collection = database.collection<TSchema>(this.name);
    return collection;
  }
}
