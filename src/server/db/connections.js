// src/server/db/connections.js
import { MongoClient } from 'mongodb';

let client = null;

export async function getConnection(uri) {
  if (!client) {
    try {
      client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      await client.connect();
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
  return client;
}

export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
  }
}