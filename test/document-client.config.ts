import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const isTest = process.env.JEST_WORKER_ID;
export default new DocumentClient({
  ...(isTest && {
    endpoint: 'http://127.0.0.1:8000',
    sslEnabled: false,
    region: 'us-west-2',
  }),
});
