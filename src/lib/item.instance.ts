import { DynamoDB } from 'aws-sdk';
import { TypeOf } from 'zod';
import Item, { ItemSchema } from './item';

export default class ItemInstance<Origin extends Item<ItemSchema>> {
  constructor(
    public attributes: TypeOf<Origin['schema']>,
    private origin: Origin
  ) {}
  public async save() {
    this.origin.validate(this.attributes);
    const primaryKey = this.origin.getPrimaryAttributes(this.attributes);
    const AttributeUpdates: DynamoDB.DocumentClient.AttributeUpdates = {};
    Object.entries(this.attributes).forEach(attribute => {
      if (Object.keys(primaryKey).includes(attribute[0])) return;
      AttributeUpdates[attribute[0]] = {
        Action: 'PUT',
        Value: attribute[1],
      };
    });
    await this.origin.config.DocumentClient.update({
      TableName: this.origin.tableName,
      Key: primaryKey,
      AttributeUpdates,
    }).promise();
  }
  public async delete() {
    await this.origin.config.DocumentClient.delete({
      TableName: this.origin.tableName,
      Key: this.origin.getPrimaryAttributes(this.attributes),
    }).promise();
  }
}
