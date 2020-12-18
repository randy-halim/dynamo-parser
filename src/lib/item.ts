import { object, TypeOf, ZodObject } from 'zod';
import { ZodPrimitives } from './custom-zod';
import ItemInstance from './item.instance';
import DynamoDB, { DocumentClient } from 'aws-sdk/clients/dynamodb';

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
  public create(item: unknown): ItemInstance<Item<Schema>> {
    const res = this.validate(item);
    return new ItemInstance(res, this);
  }
  public async get(Key: {
    [keyAttribute: string]: unknown;
  }): Promise<ItemInstance<Item<Schema>>> {
    const { Item } = await this.DocumentClient.get({
      Key,
      TableName: this.tableName,
    }).promise();
    if (!Item) throw new Error("Your getItem request didn't return a item.");
    return new ItemInstance(this.validate(Item), this);
  }
  public async query(
    primaryAttribute: AttributeQuery,
    indexName?: string,
    secondaryAttribute?: AttributeQuery
  ): Promise<ItemInstance<Item<Schema>>[]> {
    const AttributeNames = {
      '#PK': primaryAttribute.attributeName,
      ...(secondaryAttribute && {
        '#SK': secondaryAttribute.attributeName,
      }),
    };
    const AttributeValues = {
      ':pk': primaryAttribute.query[1],
      ':pkb': primaryAttribute.query[2],
      ...(secondaryAttribute && {
        ':sk': secondaryAttribute.query[1],
        ':skb': secondaryAttribute.query[2],
      }),
    };
    let QueryExpression: string = '';
    switch (primaryAttribute.query[0]) {
      case 'starts_with':
        QueryExpression += 'starts_with( #PK, :pk ) ';
        break;
      case '=':
      case '<':
      case '<=':
      case '>':
      case '>=':
        QueryExpression += `#PK ${primaryAttribute.query[0]} :pk `;
        break;
      case 'between':
        QueryExpression += '#PK BETWEEN :pk AND :pkb ';
        break;
    }
    switch (secondaryAttribute?.query[0]) {
      case 'starts_with':
        QueryExpression += 'starts_with( #SK, :sk ) ';
        break;
      case '=':
      case '<':
      case '<=':
      case '>':
      case '>=':
        QueryExpression += `#SK ${primaryAttribute.query[0]} :sk `;
        break;
      case 'between':
        QueryExpression += '#SK BETWEEN :sk AND :skb ';
        break;
    }
    const { Items } = await this.DocumentClient.query({
      TableName: this.tableName,
      KeyConditionExpression: QueryExpression,
      ExpressionAttributeNames: AttributeNames,
      ExpressionAttributeValues: AttributeValues,
      IndexName: indexName,
    }).promise();
    if (!Items) throw new Error("Your query didn't return anything.");
    return Items.map(item => new ItemInstance(this.validate(item), this));
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
