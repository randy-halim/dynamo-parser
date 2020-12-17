const tableConfig = {
  tables : [
    {
      TableName : 'my-table',
      KeySchema : [
        {
          AttributeName : 'id',
          KeyType : 'HASH',
        },
      ],
      AttributeDefinitions : [
        {
          AttributeName : 'id',
          AttributeType : 'S',
        },
      ],
      ProvisionedThroughput : {ReadCapacityUnits : 1, WriteCapacityUnits : 1},
    },
  ],
  port : 8000,
};
module.exports = tableConfig;
