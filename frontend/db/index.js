import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { inviteTokens, authorizedUsers } from "./schema";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, {
  schema: {
    inviteTokens,
    authorizedUsers,
  },
});
