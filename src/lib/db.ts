import { Pool } from 'pg';

// Using a module-level variable to hold the connection pool.
let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    // We instantiate the pool with or without the string, if it fails downstream,
    // it will be because the DB isn't provisioned yet.
    pool = new Pool({
      connectionString,
    });
    
    // We don't deliberately throw here so the app can start (graceful degradation)
    // if the user hasn't set up the database yet in AI Studio.
  }
  return pool;
}

export async function checkDbConnection() {
  try {
    const activePool = getDbPool();
    const result = await activePool.query('SELECT NOW()');
    return { status: 'connected', time: result.rows[0].now };
  } catch (error) {
    console.warn("[AEME OS] Database connection pending setup.");
    return { status: 'disconnected', error: String(error) };
  }
}
