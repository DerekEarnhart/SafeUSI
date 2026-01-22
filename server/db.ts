import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool configuration for Render's free tier
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 5,                    // Maximum number of connections in the pool
  min: 1,                    // Minimum number of connections
  idleTimeoutMillis: 30000,  // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for acquiring a connection (10 seconds)
  // Neon-specific optimizations
  allowExitOnIdle: true,     // Allow process to exit when pool is idle
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle({ client: pool, schema });

// Utility function to execute database operations with timeout and retry
export async function withDbTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 8000,
  retries: number = 2
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
        )
      ]);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`Database operation failed (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      
      // Don't retry on certain errors
      if (error.message?.includes('duplicate key') || 
          error.message?.includes('violates foreign key')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Database operation failed after retries');
}

// Quick check function to test database connectivity
export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}
