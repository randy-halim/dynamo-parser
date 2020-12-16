import { boolean, number, string } from 'zod';
import Item from '../src/lib/item';

it('Creates an item without error', () => {
  expect(
    new Item({
      stringProp: string(),
      numberProp: number(),
      booleanProp: boolean(),
    })
  ).toBeInstanceOf(Item);
});
it('Correctly returns parsed value and throws for invalid', () => {
  const myItem = new Item({
    stringProp: string().max(3),
  });
  expect(myItem.create({ stringProp: 'foo' })).toMatchObject({
    stringProp: 'foo',
  });
  expect(myItem.create.bind(myItem, { stringProp: 'longer' })).toThrow();
  expect(myItem.create.bind(myItem, { stringProp: true })).toThrow();
});
