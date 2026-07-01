import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

let sql: SqlClient | null = null;

export function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sql) sql = neon(process.env.DATABASE_URL);
  return sql;
}
