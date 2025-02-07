import { Document } from "mongodb";
import { CollectionHolder } from "./CollectinHolder";

export class CollectionHolderWrapper<
  TSchema extends Document = Document,
> extends CollectionHolder<TSchema> {
  constructor(name: string) {
    super(name);
  }
}
