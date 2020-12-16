import { DynamoDB } from 'aws-sdk';
import { ZodObject } from 'zod';

export default class ItemInstance<T> {
  /** used internally. */
  constructor(
    public attributes: T,
    private schema: ZodObject<{}>,
    private DocumentClient: DynamoDB.DocumentClient,
    private TableName: string,
    private key: { [attributes: string]: unknown }
  ) {}
  /**
   * Parses, then save the item to DynamoDB. Internally uses `DocumentClient.update`.
   */
  public async save() {
    this.schema.parse(this.attributes);
    if (!this.key) throw new Error("The primary key hasn't been set!");
    const AttributeUpdates: DynamoDB.DocumentClient.AttributeUpdates = {};
    Object.entries(this.attributes).forEach(attribute => {
      if (Object.keys(this.key as object).includes(attribute[0])) return;
      AttributeUpdates[attribute[0]] = {
        Action: 'PUT',
        Value: attribute[1],
      };
    });
    await this.DocumentClient.update({
      TableName: this.TableName,
      Key: this.key,
      AttributeUpdates,
    }).promise();
  }
  /**
   * Deletes the item from DynamoDB. Internally uses `DocumentClient.delete`
   */
  public async delete() {
    await this.DocumentClient.delete({
      TableName: this.TableName,
      Key: this.key,
    }).promise();
  }
}
