import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI not defined in .env.local");

const options = {
  tls: true,
  tlsInsecure: true, // stronger than tlsAllowInvalidCertificates
  serverSelectionTimeoutMS: 5000,
};

let clientPromise = global._mongoClientPromise;
if (!clientPromise) {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
  global._mongoClientPromise = clientPromise;
}

export function getClientPromise() {
  return clientPromise;
}
