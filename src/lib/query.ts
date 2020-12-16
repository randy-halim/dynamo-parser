import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { randomBytes } from 'crypto';

export default class Query {
  private queryIterable: QueryIterable = [];
  private updateCurrentKey(expression: QueryExpression) {
    const currentKey = this.queryIterable.pop();
    if (!currentKey) throw new Error('You need to start a query with .key()');
    currentKey[1].push(expression);
  }
  constructor(
    private TableName: string,
    private DocumentClient: DocumentClient,
    // private schema: ZodObject<ItemSchema>,
    private options?: QueryOptions
  ) {}
  public async execute() {
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};
    // let queryExpression: string = "";
    for (const attribute of this.queryIterable) {
      const attributeKey = randomBytes(7)
        .toString('hex')
        .slice(0, 7);
      expressionAttributeNames[`#${attributeKey}`] = attribute[0];
      attribute[1].forEach((query, index) => {
        const valueKey = `:${attributeKey}${index}`;
        if (!query[1]) return;
        expressionAttributeValues[valueKey] = query[1];
        switch (query[0]) {
          case 'LT':
          case 'LE':
          case 'GT':
          case 'GE':
          // queryExpression += ``
        }
      });
    }
    this.DocumentClient.query({
      TableName: this.TableName,
      IndexName: this.options?.globalSecondaryIndex,
    });
    return;
  }
  public and() {
    return this;
  }
  public key(key: string) {
    this.queryIterable.push([key, []]);
    return this;
  }
  public eq(eq: unknown) {
    this.updateCurrentKey(['EQ', eq]);
    return this;
  }
  public lt(lt: number) {
    this.updateCurrentKey(['LT', lt]);
    return this;
  }
  public gt(gt: number) {
    this.updateCurrentKey(['GT', gt]);
    return this;
  }
  public lteq(lteq: number) {
    this.updateCurrentKey(['LE', lteq]);
    return this;
  }
  public gteq(gteq: number) {
    this.updateCurrentKey(['GE', gteq]);
    return this;
  }
  public between(lowerRange: number, upperRange: number) {
    this.updateCurrentKey(['BETWEEN', [lowerRange, upperRange]]);
    return this;
  }
  public null() {
    this.updateCurrentKey(['NULL']);
    return this;
  }
  public notNull() {
    this.updateCurrentKey(['NOT_NULL']);
    return this;
  }
  public beginsWith(beginsWith: string) {
    this.updateCurrentKey(['BEGINS_WITH', beginsWith]);
    return this;
  }
}
export interface QueryOptions {
  globalSecondaryIndex?: string;
  limit?: number;
}
type QueryExpression =
  | ['EQ' | 'CONTAINS', unknown]
  | ['LT' | 'GT' | 'LE' | 'GE', number]
  | ['BETWEEN', [number, number]]
  | ['BEGINS_WITH', string]
  | ['NULL' | 'NOT_NULL'];
type QueryIterable = [string, QueryExpression[]][];
