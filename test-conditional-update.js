// Test updating conditional pricing
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema.ts";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql, { schema });

async function testUpdate() {
  try {
    // Find "YOUR CHOICE 2Täytettä"
    const [item] = await db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.name, "YOUR CHOICE 2Täytettä"))
      .limit(1);
    
    if (!item) {
      console.log("❌ Item not found");
      return;
    }
    
    console.log("📋 Current state:", {
      id: item.id,
      name: item.name,
      hasConditionalPricing: item.hasConditionalPricing,
      includedToppingsCount: item.includedToppingsCount
    });
    
    // Update it
    console.log("\n🔄 Updating to hasConditionalPricing=true, includedToppingsCount=3...");
    const [updated] = await db
      .update(schema.menuItems)
      .set({
        hasConditionalPricing: true,
        includedToppingsCount: 3
      })
      .where(eq(schema.menuItems.id, item.id))
      .returning();
    
    console.log("\n✅ Updated state:", {
      id: updated.id,
      name: updated.name,
      hasConditionalPricing: updated.hasConditionalPricing,
      includedToppingsCount: updated.includedToppingsCount
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sql.end();
  }
}

testUpdate();
