# dynamo-parser

_Parse, don't validate_  
This package is in early development, and things may change at any time!

`dynamo-parser` is a tool to work with AWS DynamoDB built with TypeScript. Using the power of [zod](https://github.com/colinhacks/zod), you get static type inference as well as ensuring that all your records match your schema!

# Installation

```zsh
# with yarn
yarn add zod@next aws-sdk # peer dependencies
yarn add dynamo-parser

# or npm
npm i zod@next aws-sdk # peer dependencies
npm i dynamo-parser
```

# Usage

Your journey starts with the `Item`:

```ts
import { Item } from 'dynamo-parser';
import z from 'zod';

const Book = new Item(
  'books-table',
  {
    title: z.string(),
    rating: z
      .number()
      .min(1)
      .max(5),
  },
  ['title']
);
```

`Item` needs a table name, the schema of your item, and the primary attribute names of the item. You can optionally specify other options, including plugging in your own instance of `AWS.DynamoDB.DocumentClient` (defaults to `"us-west-2"`).

You can then call various methods on your `Item`, including:

```ts
Book.new({
  title: 'Ready Player One',
  rating: 5,
});
Book.get({ title: 'Ready Player Two' });
Book.all(); // get all items from the table
```

---

Created with 💖 with tsdx.
