import { TypeOf } from 'zod';
import DynamoDBUtils from '@aws-sdk/util-dynamodb';
import Item, { ItemSchema } from './item';

export default class ItemInstance<Origin extends Item<ItemSchema>> {
  constructor(
    public attributes: TypeOf<Origin['schema']>,
    private origin: Origin
  ) {}
  public async save() {
    this.origin.validate(this.attributes);
    await this.origin.DocumentClient.putItem({
      TableName: this.origin.tableName,
      Item: DynamoDBUtils.marshall(this.attributes),
    });
  }
  public async delete() {
    await this.origin.DocumentClient.deleteItem({
      TableName: this.origin.tableName,
      Key: DynamoDBUtils.marshall(
        this.origin.getPrimaryAttributes(this.attributes)
      ),
    });
  }
}
