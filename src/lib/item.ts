import { object, TypeOf, ZodObject } from 'zod';
import { ZodPrimitives } from './custom-zod';
import ItemInstance from './item.instance';
import DynamoDB, { DocumentClient } from 'aws-sdk/clients/dynamodb';
import Query from './query';
import { Key } from './key';

export default class Item<Schema extends ItemSchema> {
  public schema: ZodObject<Schema, 'strip'>;
  constructor(
    public tableName: string,
    schema: Schema,
    private primaryAttributeNames: PrimaryAttributeNames,
    public DocumentClient: DocumentClient = new DynamoDB.DocumentClient({
      region: 'us-west-2',
      apiVersion: '2012-08-10',
    })
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
  public create(
    item: TypeOf<Item<Schema>['schema']>
  ): ItemInstance<Item<Schema>> {
    const res = this.validate(item);
    return new ItemInstance(res, this);
  }
  public async get(Key: Key): Promise<ItemInstance<Item<Schema>>> {
    const { Item } = await this.DocumentClient.get({
      Key,
      TableName: this.tableName,
    }).promise();
    if (!Item) throw new Error("Your getItem request didn't return a item.");
    return new ItemInstance(this.validate(Item), this);
  }
  public query(indexName?: string): Query<Item<Schema>> {
    return new Query(this, indexName);
  }
  public async all(): Promise<ItemInstance<Item<Schema>>[]> {
    let LastEvaluatedKey: DocumentClient.Key | undefined;
    let items: DocumentClient.ItemList = [];
    do {
      const res = await this.DocumentClient.scan({
        TableName: this.tableName,
        ExclusiveStartKey: LastEvaluatedKey,
      }).promise();
      LastEvaluatedKey = res.LastEvaluatedKey;
      if (!res.Items) break;
      items.push(...res.Items);
    } while (LastEvaluatedKey);
    return items.map(item => new ItemInstance(this.validate(item), this));
  }
}

export type PrimaryAttributeNames = [string] | [string, string];
export type SingleItemSchema = {
  [attribute: string]: ZodPrimitives | ZodObject<SingleItemSchema>;
};
export type ItemSchema = SingleItemSchema;
export type QueryOperator =
  | ['=', unknown]
  | ['starts_with', string]
  | ['>=' | '>' | '<=' | '<', number]
  | ['between', number, number];
export interface AttributeQuery {
  attributeName: string;
  query: QueryOperator;
}
