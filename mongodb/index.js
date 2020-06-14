const { MongoClient } = require('mongodb');

function createConnectionMiddleware({ mongodbUri, databaseName }) {
  return async (context, STOP_SIGNAL) => {
    const client = await MongoClient.connect(mongodbUri);

    context.mongodb = {
      client,
      db: client.db(databaseName),
    };
  }
}

async function closeConnectionMiddleware(context, STOP_SIGNAL) {
  if (context.mongodb && context.mongodb.client && context.mongodb.client.isConnected()) {
    await context.mongodb.client.close();
  }
}

module.exports = {
  mongodbConnection: createConnectionMiddleware,
  mongodbDisposal: closeConnectionMiddleware,
};
