import { object, ZodObject } from 'zod';
import { ZodPrimitives } from './custom-zod';
import { DynamoDB } from 'aws-sdk';
import ItemInstance from './item.instance';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export default class Item<
  T extends ItemSchema,
  K extends [string] | [string, string]
> {
  /**
   * The Item's schema. Uses zod for object parsing, ensuring that the values you get always match the format.
   */
  private schema: ZodObject<T>;
  /**
   * Construct a new `Item` that belongs to your table.
   * @param tableName The table name where your Item will be placed in.
   * @param schema A Zod schema, used to parse objects
   * @param key A tuple of the `primary` and optionally, the `sort` key
   * @param config Extra configuration, including a spot where you can put in your own `DocumentClient` instance.
   */
  constructor(
    public tableName: string,
    schema: T,
    private key: K,
    private config: ItemConfig = {
      DocumentClient: new DynamoDB.DocumentClient({ region: 'us-west-2' }),
    }
  ) {
    this.schema = object(schema);
  }
  /**
   * Validate the given object with the `Item`'s Zod schema.
   * @param x Anything to be validated.
   * @returns Typed object if it passes, throws error if it doesn't match schema.
   */
  private validate(x: unknown) {
    return this.schema.parse(x);
  }
  /**
   * Gets the primary key of the object, based on config.
   * @param object Object to pull primary key(s) from.
   */
  private findPrimaryKey(object: Record<string, unknown>) {
    const primaryKey: Record<string, unknown> = {};
    this.key.forEach(key => {
      const foundVal = object[key];
      if (!foundVal)
        throw new Error(`Unable to find primary key "${key} in object."`);
      primaryKey[key] = foundVal;
    });
    return primaryKey;
  }
  /**
   * Create a new ItemInstance, based on raw input.
   * @param item An object that will be parsed to match the Zod schema.
   */
  public create(item: unknown) {
    const res = this.validate(item);
    return new ItemInstance(
      res,
      this.schema,
      this.config.DocumentClient,
      this.tableName,
      this.findPrimaryKey(res)
    );
  }
  /**
   * Asynchronously gets a single item from DynamoDB.
   * @param Key The primary key to get the item from DynamoDB.
   */
  public async get(Key: { [keyAttribute: string]: unknown }) {
    const { Item } = await this.config.DocumentClient.get({
      Key,
      TableName: this.tableName,
    }).promise();
    if (!Item) throw new Error("Your getItem request didn't return a item.");
    return new ItemInstance(
      this.validate(Item),
      this.schema,
      this.config.DocumentClient,
      this.tableName,
      Key
    );
  }
  /**
   * @deprecated work in progress.
   */
  public query() {}
  /**
   * Retrieve all the items in the DynamoDB table, handling setting the LastEvaluatedKey to get all items. Internally uses multiple `DocumentClient.scan` calls, depending on how many items are in the table.
   */
  public async all() {
    let LastEvaluatedKey: DocumentClient.Key | undefined;
    let items: DocumentClient.ItemList = [];
    do {
      const res = await this.config.DocumentClient.scan({
        TableName: this.tableName,
        ExclusiveStartKey: LastEvaluatedKey,
      }).promise();
      LastEvaluatedKey = res.LastEvaluatedKey;
      if (!res.Items) break;
      items.push(...res.Items);
    } while (LastEvaluatedKey);
    return items.map(item => this.schema.parse(item));
  }
}

export type ItemSchema = {
  [attribute: string]: ZodPrimitives | ZodObject<ItemSchema>;
};
interface ItemConfig {
  DocumentClient: DynamoDB.DocumentClient;
}
