import { object, TypeOf, ZodObject } from 'zod';
import { ZodPrimitives } from './custom-zod';
import { DynamoDB } from 'aws-sdk';
import ItemInstance from './item.instance';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export default class Item<Schema extends ItemSchema> {
  public schema: ZodObject<Schema, 'strip'>;
  constructor(
    public tableName: string,
    schema: Schema,
    private primaryAttributeNames: PrimaryAttributeNames,
    public config: ItemConfig = {
      DocumentClient: new DynamoDB.DocumentClient({ region: 'us-west-2' }),
    }
  ) {
    this.schema = object(schema).strip();
  }

  public validate(x: unknown) {
    return this.schema.parse(x);
  }
  public getPrimaryAttributes(object: TypeOf<Item<Schema>['schema']>) {
    const primaryKey: Record<string, unknown> = {};
    this.primaryAttributeNames.forEach(key => {
      const foundVal = (object as Record<string, unknown>)[key];
      if (!foundVal)
        throw new Error(
          `Unable to find primary key "${key}" in provided object.`
        );
      primaryKey[key] = foundVal;
    });
    return primaryKey;
  }
  public create(item: unknown): ItemInstance<Item<Schema>> {
    const res = this.validate(item);
    return new ItemInstance(res, this);
  }
  public async get(Key: {
    [keyAttribute: string]: unknown;
  }): Promise<ItemInstance<Item<Schema>>> {
    const { Item } = await this.config.DocumentClient.get({
      Key,
      TableName: this.tableName,
    }).promise();
    if (!Item) throw new Error("Your getItem request didn't return a item.");
    return new ItemInstance(this.validate(Item), this);
  }
  public query() {}
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

export type PrimaryAttributeNames = [string] | [string, string];
export type SingleItemSchema = {
  [attribute: string]: ZodPrimitives | ZodObject<SingleItemSchema>;
};
export type ItemSchema = SingleItemSchema;
interface ItemConfig {
  DocumentClient: DynamoDB.DocumentClient;
}
