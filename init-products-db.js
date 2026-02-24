require("dotenv").config({ path: ".env.local" });
const sql = require("./lib/db").default;

async function initProductsDb() {
    console.log("Initializing products database...");
    try {
        // Create products table
        await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        image TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log("✅ Products table ensured.");

        // Check if table is empty before seeding
        const products = await sql`SELECT count(*) FROM products`;
        if (parseInt(products[0].count) === 0) {
            console.log("Seeding initial products...");
            const initialProducts = [
                { name: "Artisanal Sourdough", category: "Breads", price: 280, image: "/images/bakery/sourdough.png" },
                { name: "Butter Croissants (Set of 4)", category: "Pastries", price: 450, image: "/images/bakery/croissant.png" },
                { name: "Pain au Chocolat", category: "Pastries", price: 180, image: "/images/bakery/pain_au_chocolat.png" },
                { name: "Multigrain Baguette", category: "Breads", price: 120, image: "/images/bakery/baguette.png" },
                { name: "Classic Cheesecake (Full)", category: "Cakes", price: 1200, image: "/images/bakery/cheesecake.png" },
                { name: "Danish Pastry", category: "Pastries", price: 160, image: "/images/bakery/danish.png" },
                { name: "Herb Focaccia", category: "Breads", price: 220, image: "/images/bakery/focaccia.png" },
                { name: "Blueberry Muffin Box (Set of 6)", category: "Pastries", price: 600, image: "/images/bakery/muffin.png" },
                { name: "Gooey Walnut Brownies", category: "Pastries", price: 140, image: "/images/bakery/brownie.png" },
                { name: "Red Velvet Cake", category: "Cakes", price: 1400, image: "/images/bakery/red_velvet.png" },
            ];

            for (const p of initialProducts) {
                await sql`
          INSERT INTO products (name, category, price, image)
          VALUES (${p.name}, ${p.category}, ${p.price}, ${p.image})
        `;
            }
            console.log("✅ Initial products seeded.");
        } else {
            console.log("ℹ️ Products table already has data, skipping seed.");
        }
    } catch (err) {
        console.error("❌ Error initializing products database:", err);
    } finally {
        process.exit();
    }
}

initProductsDb();
