import Item, { ItemSchema } from './item';
import ItemInstance from './item.instance';
import { Key } from './key';

export default class Transactive<Origin extends Item<ItemSchema>> {
  constructor(private Item: Origin) {}
  public async get(keysToGet: Key[]) {
    if (keysToGet.length === 0 || keysToGet.length > 25)
      throw new Error(
        `You can only have a max of 25 operations in a transactive get (you have ${keysToGet.length} operations).`
      );
    const { Responses } = await this.Item.DocumentClient.transactGet({
      TransactItems: keysToGet.map(key => {
        return {
          Get: {
            TableName: this.Item.tableName,
            Key: key,
          },
        };
      }),
    }).promise();
    return Responses?.map(item => this.Item.validate(item));
  }
  public async save(itemsToSave: ItemInstance<Origin>[]) {
    if (itemsToSave.length === 0 || itemsToSave.length > 10)
      throw new Error(
        `You can only have a max of 10 operations in a transactive save (you have ${itemsToSave.length} operations).`
      );
    await this.Item.DocumentClient.transactWrite({
      TransactItems: itemsToSave.map(item => {
        return {
          Put: {
            TableName: this.Item.tableName,
            Item: item.attributes,
          },
        };
      }),
    }).promise();
  }
  public async delete(itemsToDelete: ItemInstance<Origin>[]) {
    await this.Item.DocumentClient.transactWrite({
      TransactItems: itemsToDelete.map(item => {
        return {
          Delete: {
            TableName: this.Item.tableName,
            Key: this.Item.getPrimaryAttributes(item.attributes),
          },
        };
      }),
    }).promise();
  }
}
