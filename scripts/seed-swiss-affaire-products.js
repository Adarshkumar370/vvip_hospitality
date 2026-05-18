const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const postgres = require("postgres");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const bucket = process.env.SUPABASE_STORAGE_BUCKET || "products";
const projectId = process.env.SUPABASE_PROJECT_ID;
const backendSchemaDir = "D:\\Projects\\vvip_backend_details";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!process.env.SUPABASE_S3_ENDPOINT) throw new Error("SUPABASE_S3_ENDPOINT is required");
if (!process.env.SUPABASE_S3_ACCESS_KEY_ID) throw new Error("SUPABASE_S3_ACCESS_KEY_ID is required");
if (!process.env.SUPABASE_S3_SECRET_ACCESS_KEY) throw new Error("SUPABASE_S3_SECRET_ACCESS_KEY is required");
if (!projectId) throw new Error("SUPABASE_PROJECT_ID is required");

const s3 = new S3Client({
  forcePathStyle: true,
  region: "ap-south-1",
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
  },
});

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const imageSources = {
  bread: {
    label: "Bread loaves",
    pageUrl: "https://www.pexels.com/photo/loaf-of-bread-10075983/",
    directUrl: "https://images.pexels.com/photos/10075983/pexels-photo-10075983.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  buns: {
    label: "Burger buns",
    pageUrl: "https://www.pexels.com/photo/burger-buns-with-sesame-seeds-9673517/",
    directUrl: "https://images.pexels.com/photos/9673517/pexels-photo-9673517.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  flatbread: {
    label: "Flatbread",
    pageUrl: "https://www.pexels.com/photo/flat-bread-in-kitchen-20607941/",
    directUrl: "https://images.pexels.com/photos/20607941/pexels-photo-20607941.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  garlic: {
    label: "Garlic bread",
    pageUrl: "https://www.pexels.com/photo/close-up-of-freshly-baked-garlic-bread-loaves-37043987/",
    directUrl: "https://images.pexels.com/photos/37043987/pexels-photo-37043987.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  baguette: {
    label: "Baguette",
    pageUrl: "https://www.pexels.com/photo/close-up-photo-of-baguettes-11953880/",
    directUrl: "https://images.pexels.com/photos/11953880/pexels-photo-11953880.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  focaccia: {
    label: "Focaccia",
    pageUrl: "https://www.pexels.com/photo/freshly-baked-focaccia-with-vibrant-toppings-32944459/",
    directUrl: "https://images.pexels.com/photos/32944459/pexels-photo-32944459.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  croissant: {
    label: "Croissant",
    pageUrl: "https://www.pexels.com/photo/croissants-in-a-bakery-18058319/",
    directUrl: "https://images.pexels.com/photos/18058319/pexels-photo-18058319.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  muffin: {
    label: "Muffins",
    pageUrl: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa",
    directUrl: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=1400&q=80",
  },
  cupcake: {
    label: "Cupcakes",
    pageUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d",
    directUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1400&q=80",
  },
  tart: {
    label: "Fruit tart",
    pageUrl: "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81",
    directUrl: "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=1400&q=80",
  },
  brownie: {
    label: "Brownies",
    pageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c",
    directUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1400&q=80",
  },
  doughnut: {
    label: "Doughnuts",
    pageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b",
    directUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1400&q=80",
  },
  cookies: {
    label: "Cookies",
    pageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e",
    directUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1400&q=80",
  },
  savory: {
    label: "Savory bakes",
    pageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    directUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=80",
  },
  pizza: {
    label: "Pizza dough",
    pageUrl: "https://www.pexels.com/photo/pizza-dough-20281829/",
    directUrl: "https://images.pexels.com/photos/20281829/pexels-photo-20281829.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
};

const categories = [
  ["Breads", "Fresh sandwich, jumbo, white, brown, multigrain, and sourdough breads.", "bread", 10],
  ["Buns & Pav", "Burger buns, sliders, ladi pav, and pav packs.", "buns", 20],
  ["Kulcha & Flatbreads", "Kulcha, taco, pita, tortilla, and flatbread formats.", "flatbread", 30],
  ["Garlic Breads", "Garlic loaf, garlic rounds, bread sticks, and herb breads.", "garlic", 40],
  ["Focaccia & Pizza Bases", "Focaccia and pizza bases for kitchen service.", "focaccia", 50],
  ["Croissants & Viennoiserie", "Croissants, Danish, cream roll shells, and viennoiserie.", "croissant", 60],
  ["Muffins & Cupcakes", "Muffins and single-serve cupcakes.", "cupcake", 70],
  ["Tarts, Mousse & Desserts", "Choco lava, tarts, mousse, and plated dessert components.", "tart", 80],
  ["Brownies", "Brownie pieces, slabs, and crush.", "brownie", 90],
  ["Doughnuts & Bagels", "Glazed doughnuts and bagels.", "doughnut", 100],
  ["Cookies & Savory Crisps", "Cookies, biscotti, soup sticks, lavash, and crisp bakery sides.", "cookies", 110],
  ["Puffs & Savory Bakes", "Puffs, baked samosa, and vol-au-vent shells.", "savory", 120],
  ["Rolls & Sandwich Bases", "Hotdog rolls, panini, subrolls, and dinner rolls.", "buns", 130],
  ["Dry Cakes", "Tea-time dry cakes in loaf format.", "muffin", 140],
];

const units = [
  ["loaf", "Loaf", "loaf", false, 0],
  ["piece", "Piece", "pc", false, 0],
  ["pkt_4pcs", "Packet of 4 pieces", "pkt (4pcs)", false, 0],
  ["pkt_5pcs", "Packet of 5 pieces", "pkt (5pcs)", false, 0],
  ["kilogram", "Kilogram", "kg", true, 3],
];

const products = [
  [1, "Whole Wheat Jumbo Bread", "Breads", "loaf", 155, "bread"],
  [2, "Multigrain Jumbo Bread", "Breads", "loaf", 150, "bread"],
  [3, "Jumbo Brown Bread", "Breads", "loaf", 135, "bread"],
  [4, "Jumbo White Bread", "Breads", "loaf", 130, "bread"],
  [5, "Multigrain Bread 400gm", "Breads", "loaf", 45, "bread"],
  [6, "White Bread 400gm", "Breads", "loaf", 45, "bread"],
  [7, "Brown Bread 400gm", "Breads", "loaf", 45, "bread"],
  [8, "Burger", "Buns & Pav", "pkt_4pcs", 40, "buns"],
  [9, "Multigrain Burger", "Buns & Pav", "pkt_4pcs", 45, "buns"],
  [10, "Sweet Burger", "Buns & Pav", "pkt_4pcs", 40, "buns"],
  [11, "Multigrain Burger 4.5''", "Buns & Pav", "piece", 12.5, "buns"],
  [12, "Outcolour/Nino Burger 4.5''", "Buns & Pav", "piece", 12.5, "buns"],
  [13, "Slider Burger", "Buns & Pav", "piece", 7, "buns"],
  [14, "Colored Slider Burger", "Buns & Pav", "piece", 10, "buns"],
  [15, "Kulcha", "Kulcha & Flatbreads", "pkt_5pcs", 40, "flatbread"],
  [16, "Atta Kulcha", "Kulcha & Flatbreads", "pkt_5pcs", 50, "flatbread"],
  [17, "Whole Wheat Kulcha", "Kulcha & Flatbreads", "pkt_5pcs", 50, "flatbread"],
  [18, "Ladi Pav", "Buns & Pav", "piece", 11.5, "buns"],
  [19, "Pav", "Buns & Pav", "pkt_5pcs", 40, "buns"],
  [20, "Hotdog", "Rolls & Sandwich Bases", "pkt_5pcs", 55, "buns"],
  [21, "Wheat Hotdog", "Rolls & Sandwich Bases", "pkt_5pcs", 60, "buns"],
  [22, "Oregano Panini", "Rolls & Sandwich Bases", "piece", 20, "buns"],
  [23, "Multigrain Panini", "Rolls & Sandwich Bases", "piece", 25, "buns"],
  [24, "Vanilla Dry Cake 250gm", "Dry Cakes", "loaf", 200, "muffin"],
  [25, "Chocolate Dry Cake 250gm", "Dry Cakes", "loaf", 225, "brownie"],
  [26, "Dry Fruit Dry Cake 250gm", "Dry Cakes", "loaf", 250, "muffin"],
  [27, "Garlic Loaf", "Garlic Breads", "loaf", 50, "garlic"],
  [28, "Whole Wheat Garlic Loaf", "Garlic Breads", "loaf", 55, "garlic"],
  [29, "French Baguette", "Garlic Breads", "loaf", 55, "baguette"],
  [30, "Garlic Bread Round", "Garlic Breads", "loaf", 40, "garlic"],
  [31, "Garlic Bread Stick", "Garlic Breads", "loaf", 45, "garlic"],
  [32, "Sourdough Bread", "Breads", "loaf", 100, "bread"],
  [33, "Classic Focaccia", "Focaccia & Pizza Bases", "piece", 50, "focaccia"],
  [34, "Cheese Focaccia", "Focaccia & Pizza Bases", "piece", 55, "focaccia"],
  [35, "Croissant Chocolate Normal", "Croissants & Viennoiserie", "piece", 50, "croissant"],
  [36, "Croissant Vanilla Normal", "Croissants & Viennoiserie", "piece", 50, "croissant"],
  [37, "Croissant Breakfast Size", "Croissants & Viennoiserie", "piece", 35, "croissant"],
  [38, "Muffin 40gm", "Muffins & Cupcakes", "piece", 20, "muffin"],
  [39, "Muffin 80gm", "Muffins & Cupcakes", "piece", 40, "muffin"],
  [40, "Muffin 100gm", "Muffins & Cupcakes", "piece", 50, "muffin"],
  [41, "English Muffin 40gm", "Muffins & Cupcakes", "piece", 40, "muffin"],
  [42, "Pizza 6\"", "Focaccia & Pizza Bases", "piece", 14, "pizza"],
  [43, "Pizza 7''", "Focaccia & Pizza Bases", "piece", 15, "pizza"],
  [44, "Pizza 8''", "Focaccia & Pizza Bases", "piece", 16, "pizza"],
  [45, "Pizza 10''", "Focaccia & Pizza Bases", "piece", 18, "pizza"],
  [46, "Pizza 12''", "Focaccia & Pizza Bases", "piece", 20, "pizza"],
  [47, "Flatbread", "Kulcha & Flatbreads", "piece", 17, "flatbread"],
  [48, "Taco 6''", "Kulcha & Flatbreads", "piece", 15, "flatbread"],
  [49, "Pita Bread 6''", "Kulcha & Flatbreads", "piece", 15, "flatbread"],
  [50, "Tortilla 8''", "Kulcha & Flatbreads", "piece", 18, "flatbread"],
  [51, "Tortilla 10''", "Kulcha & Flatbreads", "piece", 20, "flatbread"],
  [52, "Wheat Tortilla 10\"", "Kulcha & Flatbreads", "piece", 20, "flatbread"],
  [53, "Choco Lava", "Tarts, Mousse & Desserts", "piece", 40, "tart"],
  [54, "Chocopop", "Tarts, Mousse & Desserts", "piece", 25, "tart"],
  [55, "Red Velvet Cup Cake", "Muffins & Cupcakes", "piece", 50, "cupcake"],
  [56, "Choco Chip Cup Cake", "Muffins & Cupcakes", "piece", 50, "cupcake"],
  [57, "Blueberry Cup Cake", "Muffins & Cupcakes", "piece", 50, "cupcake"],
  [58, "Vanilla Cup Cake", "Muffins & Cupcakes", "piece", 50, "cupcake"],
  [59, "Fruit Tart", "Tarts, Mousse & Desserts", "piece", 30, "tart"],
  [60, "Danish", "Croissants & Viennoiserie", "piece", 30, "croissant"],
  [61, "Mousse", "Tarts, Mousse & Desserts", "piece", 35, "tart"],
  [62, "Cream Roll Shell", "Croissants & Viennoiserie", "piece", 30, "croissant"],
  [63, "Walnut Brownie", "Brownies", "piece", 50, "brownie"],
  [64, "Walnut Brownie Slab", "Brownies", "kilogram", 700, "brownie"],
  [65, "Plain Brownie", "Brownies", "piece", 45, "brownie"],
  [66, "Plain Brownie Slab", "Brownies", "kilogram", 650, "brownie"],
  [67, "Brownie Crush", "Brownies", "kilogram", 370, "brownie"],
  [68, "Doughnut Dark", "Doughnuts & Bagels", "piece", 45, "doughnut"],
  [69, "Doughnut Pink", "Doughnuts & Bagels", "piece", 45, "doughnut"],
  [70, "Doughnut White", "Doughnuts & Bagels", "piece", 45, "doughnut"],
  [71, "Doughnut Breakfast Size", "Doughnuts & Bagels", "piece", 25, "doughnut"],
  [72, "Begal", "Doughnuts & Bagels", "piece", 50, "doughnut"],
  [73, "Jeera Cookies", "Cookies & Savory Crisps", "kilogram", 350, "cookies"],
  [74, "Ajwain Cookies", "Cookies & Savory Crisps", "kilogram", 350, "cookies"],
  [75, "Almond Biscotti", "Cookies & Savory Crisps", "kilogram", 550, "cookies"],
  [76, "Garlic Toasty", "Cookies & Savory Crisps", "kilogram", 400, "garlic"],
  [77, "Soup Stick", "Cookies & Savory Crisps", "kilogram", 500, "cookies"],
  [78, "Lavash", "Cookies & Savory Crisps", "kilogram", 750, "flatbread"],
  [79, "Dinner Roll", "Rolls & Sandwich Bases", "kilogram", 350, "buns"],
  [80, "Aloo Puff", "Puffs & Savory Bakes", "piece", 20, "savory"],
  [81, "Paneer Puff", "Puffs & Savory Bakes", "piece", 35, "savory"],
  [82, "Chicken Puff", "Puffs & Savory Bakes", "piece", 40, "savory"],
  [83, "Baked Samosa", "Puffs & Savory Bakes", "piece", 25, "savory"],
  [84, "Vol-au-vent", "Puffs & Savory Bakes", "piece", 22, "savory"],
  [85, "Croissant 8''", "Croissants & Viennoiserie", "piece", 90, "croissant"],
  [86, "Subroll 8''", "Rolls & Sandwich Bases", "piece", 25, "buns"],
];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publicUrlForKey(objectKey) {
  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${objectKey}`;
}

async function resolvePexelsImage(pageUrl) {
  const response = await fetch(pageUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 SwissAffaireCatalogSeeder/1.0",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch ${pageUrl}: ${response.status}`);
  const html = await response.text();
  const match = html.match(/https:\/\/images\.pexels\.com\/photos\/[^"'\\]+?\.jpeg(?:\?[^"'\\]+)?/);
  if (!match) throw new Error(`Could not find a Pexels image URL in ${pageUrl}`);
  const baseUrl = match[0].replace(/&amp;/g, "&").split("?")[0];
  return `${baseUrl}?auto=compress&cs=tinysrgb&w=1400`;
}

async function fetchImageBuffer(imageUrl) {
  const response = await fetch(imageUrl, {
    headers: { "user-agent": "Mozilla/5.0 SwissAffaireCatalogSeeder/1.0" },
  });
  if (!response.ok) throw new Error(`Failed to download image ${imageUrl}: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadImage(key, source) {
  const objectKey = `catalog/swiss-affaire/${key}.jpg`;
  const imageUrl = source.directUrl || await resolvePexelsImage(source.pageUrl);
  const body = await fetchImageBuffer(imageUrl);
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: body,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return {
    imageKey: key,
    label: source.label,
    pageUrl: source.pageUrl,
    s3Url: publicUrlForKey(objectKey),
  };
}

function buildGeneratedSql(imageUploads) {
  const imageMap = Object.fromEntries(imageUploads.map((item) => [item.imageKey, item.s3Url]));
  const sourceComments = imageUploads
    .map((item) => `-- ${item.imageKey}: ${item.pageUrl}`)
    .join("\n");

  const unitRows = JSON.stringify(units.map(([code, displayName, symbol, allowsFractional, decimalPrecision]) => ({
    code,
    display_name: displayName,
    symbol,
    allows_fractional: allowsFractional,
    decimal_precision: decimalPrecision,
  })), null, 2);

  const categoryRows = JSON.stringify(categories.map(([name, shortDescription, imageKey, displayOrder]) => ({
    name,
    slug: slugify(name),
    short_description: shortDescription,
    image_url: imageMap[imageKey],
    display_order: displayOrder,
  })), null, 2);

  const productRows = JSON.stringify(products.map(([displayOrder, name, category, unit, price, imageKey]) => ({
    name,
    slug: slugify(name),
    sku: `SA-${String(displayOrder).padStart(3, "0")}`,
    category_slug: slugify(category),
    unit_code: unit,
    image_url: imageMap[imageKey],
    price,
    short_description: `${name} (${unitLabel(unit)})`,
    display_order: displayOrder,
  })), null, 2);

  return `-- Swiss Affaire product catalog seed.
-- Idempotent product/category/unit seed generated by scripts/seed-swiss-affaire-products.js.
-- Product images are stored in Supabase S3 object storage and DB rows point only to those S3 URLs.
${sourceComments}

WITH unit_data AS (
    SELECT *
    FROM jsonb_to_recordset($json$${unitRows}$json$::jsonb)
        AS x(code text, display_name text, symbol text, allows_fractional boolean, decimal_precision smallint)
)
INSERT INTO measurement_units (code, display_name, symbol, allows_fractional, decimal_precision, is_active)
SELECT code, display_name, symbol, allows_fractional, decimal_precision, true
FROM unit_data
ON CONFLICT (code) DO UPDATE
SET display_name = EXCLUDED.display_name,
    symbol = EXCLUDED.symbol,
    allows_fractional = EXCLUDED.allows_fractional,
    decimal_precision = EXCLUDED.decimal_precision,
    is_active = true;

WITH category_data AS (
    SELECT *
    FROM jsonb_to_recordset($json$${categoryRows}$json$::jsonb)
        AS x(name text, slug text, short_description text, image_url text, display_order integer)
)
INSERT INTO product_categories (name, slug, short_description, image_url, display_order, status)
SELECT name, slug, short_description, image_url, display_order, 'show'
FROM category_data
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    short_description = EXCLUDED.short_description,
    image_url = EXCLUDED.image_url,
    display_order = EXCLUDED.display_order,
    status = 'show';

WITH product_data AS (
    SELECT *
    FROM jsonb_to_recordset($json$${productRows}$json$::jsonb)
        AS x(name text, slug text, sku text, category_slug text, unit_code text, image_url text, price numeric, short_description text, display_order integer)
)
INSERT INTO products (
    name, slug, sku, category_id, unit_id, image_url, price,
    short_description, status, display_order
)
SELECT
    pd.name,
    pd.slug,
    pd.sku,
    pc.id,
    mu.id,
    pd.image_url,
    pd.price,
    pd.short_description,
    'show',
    pd.display_order
FROM product_data pd
JOIN product_categories pc ON pc.slug = pd.category_slug
JOIN measurement_units mu ON mu.code = pd.unit_code
ON CONFLICT (slug) DO UPDATE
SET sku = EXCLUDED.sku,
    category_id = EXCLUDED.category_id,
    unit_id = EXCLUDED.unit_id,
    image_url = EXCLUDED.image_url,
    price = EXCLUDED.price,
    short_description = EXCLUDED.short_description,
    status = 'show',
    display_order = EXCLUDED.display_order;
`;
}

function unitLabel(unitCode) {
  const unit = units.find(([code]) => code === unitCode);
  return unit ? `per ${unit[2]}` : unitCode;
}

async function seedDatabase(imageUploads) {
  const imageMap = Object.fromEntries(imageUploads.map((item) => [item.imageKey, item.s3Url]));
  const categoryIds = new Map();
  const unitIds = new Map();

  await sql.begin(async (tx) => {
    for (const [code, displayName, symbol, allowsFractional, decimalPrecision] of units) {
      const [unit] = await tx`
        INSERT INTO measurement_units (code, display_name, symbol, allows_fractional, decimal_precision, is_active)
        VALUES (${code}, ${displayName}, ${symbol}, ${allowsFractional}, ${decimalPrecision}, true)
        ON CONFLICT (code) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            symbol = EXCLUDED.symbol,
            allows_fractional = EXCLUDED.allows_fractional,
            decimal_precision = EXCLUDED.decimal_precision,
            is_active = true
        RETURNING id
      `;
      unitIds.set(code, unit.id);
    }

    for (const [name, shortDescription, imageKey, displayOrder] of categories) {
      const [category] = await tx`
        INSERT INTO product_categories (name, slug, short_description, image_url, display_order, status)
        VALUES (${name}, ${slugify(name)}, ${shortDescription}, ${imageMap[imageKey]}, ${displayOrder}, 'show')
        ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            short_description = EXCLUDED.short_description,
            image_url = EXCLUDED.image_url,
            display_order = EXCLUDED.display_order,
            status = 'show'
        RETURNING id
      `;
      categoryIds.set(name, category.id);
    }

    for (const [displayOrder, name, categoryName, unitCode, price, imageKey] of products) {
      await tx`
        INSERT INTO products (
          name, slug, sku, category_id, unit_id, image_url, price,
          short_description, status, display_order
        )
        VALUES (
          ${name}, ${slugify(name)}, ${`SA-${String(displayOrder).padStart(3, "0")}`},
          ${categoryIds.get(categoryName)}, ${unitIds.get(unitCode)}, ${imageMap[imageKey]},
          ${price}, ${`${name} (${unitLabel(unitCode)})`}, 'show', ${displayOrder}
        )
        ON CONFLICT (slug) DO UPDATE
        SET sku = EXCLUDED.sku,
            category_id = EXCLUDED.category_id,
            unit_id = EXCLUDED.unit_id,
            image_url = EXCLUDED.image_url,
            price = EXCLUDED.price,
            short_description = EXCLUDED.short_description,
            status = 'show',
            display_order = EXCLUDED.display_order
      `;
    }
  });
}

async function main() {
  console.log(`Uploading ${Object.keys(imageSources).length} product image samples to S3 object storage...`);
  const imageUploads = [];
  for (const [key, source] of Object.entries(imageSources)) {
    const upload = await uploadImage(key, source);
    imageUploads.push(upload);
    console.log(`Uploaded ${key}: ${upload.s3Url}`);
  }

  console.log(`Upserting ${products.length} Swiss Affaire products...`);
  await seedDatabase(imageUploads);

  const generatedSql = buildGeneratedSql(imageUploads);
  const seedFilePath = path.join(backendSchemaDir, "041_seed_swiss_affaire_products.txt");
  fs.writeFileSync(seedFilePath, generatedSql, "utf8");

  console.log(`Seeded ${products.length} products and ${categories.length} categories.`);
  console.log(`Generated ${seedFilePath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
