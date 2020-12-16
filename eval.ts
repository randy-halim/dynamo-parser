import Item from './src';
import { string } from 'zod';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const Product = new Item(
  'api-products-dev',
  { sku: string(), description: string() },
  ['sku'],
  { DocumentClient: new DocumentClient({ region: 'us-west-2' }) }
);

(async () => {
  const r = await Product.get({ sku: 'test' });
  console.log(r);
})();
