import { Db, MongoClient, ServerApiVersion } from "mongodb";

let client: MongoClient;
let db: Db;

export const connectDB = async () => {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error("Please define the DB_NAME environment variable");
  }

  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    db = client.db(dbName);

    // Automatically create compound indexes to reduce search time complexity to O(log N)
    await db
      .collection("passwords")
      .createIndex({ "user.email": 1, "user.username": 1 });
    await db
      .collection("cards")
      .createIndex({ "user.email": 1, "user.username": 1 });

    // console.log("Connected to MongoDB and verified indexes");
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Failed to connect to the database");
  }
};
