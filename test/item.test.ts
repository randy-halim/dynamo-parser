import { string } from 'zod';
import Item from '../src/lib/item';

const item = new Item(
  'TEST_TABLE',
  {
<<<<<<< HEAD
    stringProp: string().max(3),
=======
    stringProp: string(),
>>>>>>> c319215f68c430f7fdb83aec267aeb5315653fb0
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
