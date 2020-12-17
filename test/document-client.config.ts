import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const isTest = process.env.JEST_WORKER_ID;
export default new DocumentClient({
  ...(isTest && {
    endpoint: 'localhost:8000',
    sslEnabled: false,
    region: 'local',
  }),
});
