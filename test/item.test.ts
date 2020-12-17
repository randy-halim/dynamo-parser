import { string } from 'zod';
import Item from '../src';

const item = new Item(
  'my-table',
  {
    id: string().max(5),
  },
  ['id']
);

describe('Item Class Tests', () => {
  it('Creates an item without error', () => {
    expect(item).toBeInstanceOf(Item);
  });
  it('Correctly returns parsed value and throws for invalid', () => {
    expect(item.create({ id: 'foo' }).attributes).toMatchSnapshot();
    expect(() => item.create({ foo: 'long_id' })).toThrow();
    expect(() => item.create({ foo: true })).toThrow();
  });
  it('Gets the correct primary key', () => {
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
