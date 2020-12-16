import { string } from 'zod';
import Item from '../src/lib/item';

const item = new Item(
  'TEST_TABLE',
  {
    stringProp: string(),
  },
  ['stringProp']
);

it('Creates an item without error', () => {
  expect(item).toBeInstanceOf(Item);
});
it('Correctly returns parsed value and throws for invalid', () => {
  expect(item.create.bind(item, { stringProp: 'foo' })).not.toThrow();
  expect(item.create.bind(item, { stringProp: 'longer' })).toThrow();
  expect(item.create.bind(item, { stringProp: true })).toThrow();
});
