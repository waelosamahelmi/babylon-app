// Check if conditional pricing columns exist and run migration if needed
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema.ts";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql, { schema });

async function checkAndMigrate() {
  try {
    console.log("🔍 Checking if conditional pricing columns exist...");
    
    // Try to query the columns
    try {
      const result = await sql`
        SELECT has_conditional_pricing, included_toppings_count 
        FROM menu_items 
        LIMIT 1
      `;
      console.log("✅ Conditional pricing columns already exist!");
      console.log("Sample data:", result[0] || "No menu items yet");
    } catch (error) {
      if (error.message.includes("does not exist") || error.message.includes("column")) {
        console.log("⚠️  Columns don't exist. Running migration...");
        
        // Read and execute the migration file
        const migrationPath = path.join(__dirname, "supabase", "migrations", "20250113000001_add_conditional_pricing.sql");
        const migrationSQL = fs.readFileSync(migrationPath, "utf8");
        
        console.log("📝 Executing migration SQL...");
        await sql.unsafe(migrationSQL);
        
        console.log("✅ Migration completed successfully!");
      } else {
        throw error;
      }
    }
    
    // Test update
    console.log("\n🧪 Testing update functionality...");
    const testResult = await sql`
      SELECT id, name, has_conditional_pricing, included_toppings_count 
      FROM menu_items 
      LIMIT 5
    `;
    console.log("Current menu items:", testResult);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkAndMigrate();
