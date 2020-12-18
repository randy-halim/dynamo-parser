import { string } from 'zod';
import Item from '../src';
import DocumentClient from './document-client.config';

const item = new Item(
  'my-table',
  {
    id: string().max(5),
  },
  ['id'],
  DocumentClient
);

describe('Item Class Tests (No AWS Operations)', () => {
  it('Creates an item without error', () => {
    expect(item).toBeInstanceOf(Item);
  });
  it('Correctly returns parsed value and throws for invalid', () => {
    expect(item.create({ id: 'foo' }).attributes).toMatchSnapshot();
    expect(() => item.create({ foo: 'long_id' })).toThrow();
    expect(() => item.create({ foo: true })).toThrow();
  });
  it('Gets the primary attribute from a specified item', () => {
    const mockItem = {
      id: 'test',
      attr1: 'foo',
      attr2: 2,
    };
    expect(item.getPrimaryAttributes(mockItem)).toMatchSnapshot();
    // @ts-ignore
    mockItem.id = undefined;
    expect(() =>
      item.getPrimaryAttributes(mockItem)
    ).toThrowErrorMatchingSnapshot();
  });
});
describe('Item Retrieval Tests (AWS Operations)', () => {
  it('Saves an item to the database', () => {
    const myItem = item.create({ id: 'test' });
    return myItem.save();
  });
  it('Gets an item from the database', async () => {
    const myItem = await item.get({ id: 'test' });
    expect(myItem).toMatchSnapshot();
  });
  it('Gets all items from the database', async () => {
    const items = await item.all();
    expect(items).toMatchSnapshot();
  });
});
