import DynamoDB from '@aws-sdk/client-dynamodb';
import DynamoDBUtils from '@aws-sdk/util-dynamodb';
import Item, { ItemSchema } from './item';
import ItemInstance from './item.instance';

export default class Query<Origin extends Item<ItemSchema>> {
  private expressionAttributeNames: ExpressionAttributeNames = ({} as unknown) as ExpressionAttributeNames;
  private expressionAttributeValues: ExpressionAttributeValues = ({} as unknown) as ExpressionAttributeValues;
  public expression = '';
  constructor(public origin: Origin, private index?: string) {}
  public hashAttribute(
    attributeName: string,
    operator: '=',
    comparator: unknown
  ): PrimaryAttributeQuery<Query<Origin>> {
    if (operator !== '=') {
      throw new Error('Hash attribute comparison must check for equality');
    }
    this.expressionAttributeNames['#PK'] = attributeName;
    this.expressionAttributeValues[':pk'] = comparator;
    this.expression += '#PK = :pk ';
    return new PrimaryAttributeQuery(
      this,
      this.expressionAttributeNames,
      this.expressionAttributeValues,
      this.index
    );
  }
}
class PrimaryAttributeQuery<Origin extends Query<Item<ItemSchema>>> {
  constructor(
    private origin: Origin,
    private expressionAttributeNames: { [key: string]: string },
    private expressionAttributeValues: {
      [key: string]: DynamoDB.AttributeValue;
    },
    private index?: string
  ) {}
  public expression = this.origin.expression;
  public async exec(): Promise<ItemInstance<Origin['origin']>[]> {
    const { DocumentClient, tableName } = this.origin.origin;
    const { Items } = await DocumentClient.query({
      TableName: tableName,
      ExpressionAttributeNames: this.expressionAttributeNames,
      ExpressionAttributeValues: this.expressionAttributeValues,
      KeyConditionExpression: this.expression,
      IndexName: this.index,
    });
    if (!Items) throw new Error('No items were returned from the table.');
    return Items.map(item => new ItemInstance(item, this.origin.origin));
  }
  public rangeAttribute(
    attributeName: string,
    operator: '=',
    comparator: unknown,
    _: undefined
  ): PrimaryAttributeQuery<Origin>['exec'];
  public rangeAttribute(
    attributeName: string,
    operator: '>=' | '<=' | '>' | '<',
    comparator: number,
    _: undefined
  ): PrimaryAttributeQuery<Origin>['exec'];
  public rangeAttribute(
    attributeName: string,
    operator: 'begins_with',
    comparator: string,
    _: undefined
  ): PrimaryAttributeQuery<Origin>['exec'];
  public rangeAttribute(
    attributeName: string,
    operator: 'between',
    lowEnd: number,
    highEnd: number
  ): PrimaryAttributeQuery<Origin>['exec'];
  public rangeAttribute(
    attributeName: string,
    operator: '=' | '>=' | '<=' | '>' | '<' | 'begins_with' | 'between',
    arg1: unknown,
    arg2: number | undefined
  ): PrimaryAttributeQuery<Origin>['exec'] {
    this.expressionAttributeNames['#SK'] = attributeName;
    this.expressionAttributeValues[':ska'] = arg1;
    this.expression += 'and ';
    switch (operator) {
      case 'between':
        this.expressionAttributeValues[':skb'] = arg2;
        this.expression += '#SK BETWEEN :ska AND :skb ';
        break;
      case 'begins_with':
        this.expression += 'begins_with( #SK, :ska ) ';
        break;
      default:
        this.expression += `#SK ${operator} :ska `;
        break;
    }
    return this.exec;
  }
}

interface ExpressionAttributeNames {
  '#PK': string;
  '#SK'?: string;
}
interface ExpressionAttributeValues {
  ':pk': unknown;
  ':ska'?: unknown;
  ':skb'?: unknown;
}
