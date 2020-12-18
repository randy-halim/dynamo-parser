import { TypeOf } from 'zod';
import Item, { ItemSchema } from './item';

export default class ItemInstance<Origin extends Item<ItemSchema>> {
  constructor(
    public attributes: TypeOf<Origin['schema']>,
    private origin: Origin
  ) {}
  public async save() {
    this.origin.validate(this.attributes);
    await this.origin.config.DocumentClient.put({
      TableName: this.origin.tableName,
      Item: this.attributes,
    }).promise();
  }
  public async delete() {
    await this.origin.config.DocumentClient.delete({
      TableName: this.origin.tableName,
      Key: this.origin.getPrimaryAttributes(this.attributes),
    }).promise();
  }
}
