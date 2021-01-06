import Item, { Transactive } from '../src/index';
import { string, number } from 'zod';
import DocumentClient from './document-client.config';

const $Book = new Item(
  'my-table',
  {
    id: string().max(5),
    bookName: string(),
    rating: number()
      .min(1)
      .max(5),
  },
  ['id'],
  DocumentClient
);
const $Book$ = new Transactive($Book);

describe('Transactive Get Operations', () => {
  beforeAll(async () => {
    await $Book
      .create({
        id: 'BOOK2',
        bookName: 'The Water Tome',
        rating: 5,
      })
      .save();
    await $Book
      .create({
        id: 'BOOK3',
        bookName: 'The Fire Tome',
        rating: 5,
      })
      .save();
    await $Book
      .create({
        id: 'BOOK1',
        bookName: 'The Earth Tome',
        rating: 4,
      })
      .save();
  });

  it('Gets all items (Books)', done => {
    $Book$
      .get([{ id: 'BOOK1' }, { id: 'BOOK2' }, { id: 'BOOK3' }])
      .then(callback);

    function callback(content: unknown) {
      try {
        expect(content).toMatchSnapshot();
        done();
      } catch (error) {
        done(error);
      }
    }
  });
  it('Should throw an error getting a non-existent item', done => {
    $Book$
      .get([{ id: 'BOOK1' }, { id: 'BOOK2' }, { id: 'NONEXISTANT' }])
      .then(completesCallback)
      .catch(throwsCallback);

    function throwsCallback(error: unknown) {
      expect(error).toMatchSnapshot();
      done();
    }
    function completesCallback(content: unknown) {
      done("Error should've been thrown", content);
    }
  });

  afterAll(async () => {
    const books = [{ id: 'BOOK1' }, { id: 'BOOK2' }, { id: 'BOOK3' }];
    for await (const book of books) {
      await (await $Book.get(book)).delete();
    }
  });
});

describe('Transactive Write Operations', () => {
  it('Creates an item successfully', done => {
    const book = {
      id: 'BOOK1',
      bookName: 'The Wind Tome',
      rating: 5,
    };
    try {
      $Book$.save([$Book.create(book)]).then(callback);
    } catch (error) {
      done(error);
    }

    async function callback() {
      expect((await $Book.get({ id: 'BOOK1' })).attributes).toMatchObject(book);
      done();
    }
  });
  it('Creates multiple items', done => {
    const multipleBooks = [
      $Book.create({
        bookName: 'Foo',
        id: 'FOO',
        rating: 1,
      }),
      $Book.create({
        bookName: 'Bar',
        id: 'BAR',
        rating: 5,
      }),
    ];
    try {
      $Book$.save(multipleBooks).then(() => done());
    } catch (error) {
      done(error);
    }
  });
});
