const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "bakery_service";

if (!uri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

const collectionSpecs = [
  {
    name: "users",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "mobile_no", "status", "payment_type"],
        properties: {
          _id: { bsonType: "string" },
          email: { bsonType: ["string", "null"] },
          mobile_no: { bsonType: "string" },
          status: { enum: ["allowed", "banned"] },
          payment_type: { enum: ["prepaid_user", "postpaid_user"] },
          addresses: { bsonType: "array" },
          postgres_version: { bsonType: ["int", "long", "double", "null"] },
          last_event_id: { bsonType: ["string", "null"] },
        },
      },
    },
    indexes: [
      { keys: { mobile_no: 1 }, options: { unique: true, name: "ux_users_mobile_no" } },
      { keys: { email: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("email"), name: "ux_users_email" } },
      { keys: { status: 1, payment_type: 1 }, options: { name: "ix_users_status_payment_type" } },
      { keys: { "addresses.postal_code": 1 }, options: { name: "ix_users_addresses_postal_code" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_users_last_event_id" } },
    ],
  },
  {
    name: "product_categories",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "name", "slug", "status"],
        properties: {
          _id: { bsonType: "string" },
          name: { bsonType: "string" },
          slug: { bsonType: "string" },
          status: { enum: ["show", "hidden"] },
          display_order: { bsonType: ["int", "long", "double", "null"] },
        },
      },
    },
    indexes: [
      { keys: { slug: 1 }, options: { unique: true, name: "ux_product_categories_slug" } },
      { keys: { status: 1, display_order: 1, name: 1 }, options: { name: "ix_product_categories_visual" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_product_categories_last_event_id" } },
    ],
  },
  {
    name: "products",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "category", "unit", "name", "slug", "price", "status"],
        properties: {
          _id: { bsonType: "string" },
          category: { bsonType: "object" },
          unit: { bsonType: "object" },
          name: { bsonType: "string" },
          slug: { bsonType: "string" },
          sku: { bsonType: ["string", "null"] },
          image_url: { bsonType: ["string", "null"] },
          price: { bsonType: "string" },
          status: { enum: ["show", "hidden"] },
        },
      },
    },
    indexes: [
      { keys: { slug: 1 }, options: { unique: true, name: "ux_products_slug" } },
      { keys: { sku: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("sku"), name: "ux_products_sku" } },
      { keys: { "category.slug": 1, status: 1, display_order: 1, name: 1 }, options: { name: "ix_products_category_visual" } },
      { keys: { status: 1, display_order: 1, name: 1 }, options: { name: "ix_products_visual" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_products_last_event_id" } },
    ],
  },
  {
    name: "orders",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "order_number", "user_id", "order_status", "items"],
        properties: {
          _id: { bsonType: "string" },
          order_number: { bsonType: "string" },
          user_id: { bsonType: "string" },
          order_status: {
            enum: [
              "payment_pending",
              "payment_failed",
              "placed",
              "confirmed",
              "preparing",
              "ready_for_pickup",
              "out_for_delivery",
              "completed",
              "cancelled",
            ],
          },
          placed_by: { enum: ["self", "staff", null] },
          placed_by_staff_id: { bsonType: ["string", "null"] },
          items: { bsonType: "array" },
          work_orders: { bsonType: ["array", "null"] },
        },
      },
    },
    indexes: [
      { keys: { order_number: 1 }, options: { unique: true, name: "ux_orders_order_number" } },
      { keys: { user_id: 1, created_at: -1 }, options: { name: "ix_orders_user_created" } },
      { keys: { order_status: 1, requested_fulfillment_at: 1 }, options: { name: "ix_orders_status_fulfillment_at" } },
      { keys: { fulfillment_type: 1, order_status: 1, requested_fulfillment_at: 1 }, options: { name: "ix_orders_fulfillment_status" } },
      { keys: { placed_by_staff_id: 1, created_at: -1 }, options: { sparse: true, name: "ix_orders_placed_by_staff" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_orders_last_event_id" } },
    ],
  },
  {
    name: "work_orders",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "work_order_number", "order_id", "task_type", "work_status"],
        properties: {
          _id: { bsonType: "string" },
          work_order_number: { bsonType: "string" },
          order_id: { bsonType: "string" },
          work_status: { enum: ["pending", "assigned", "in_progress", "blocked", "completed", "cancelled"] },
          assigned_staff_id: { bsonType: ["string", "null"] },
          assigned_designation: { bsonType: ["string", "null"] },
        },
      },
    },
    indexes: [
      { keys: { work_order_number: 1 }, options: { unique: true, name: "ux_work_orders_number" } },
      { keys: { order_id: 1, work_status: 1 }, options: { name: "ix_work_orders_order_status" } },
      { keys: { assigned_staff_id: 1, work_status: 1, due_at: 1 }, options: { sparse: true, name: "ix_work_orders_assigned_staff" } },
      { keys: { assigned_designation: 1, work_status: 1, due_at: 1 }, options: { sparse: true, name: "ix_work_orders_assigned_designation" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_work_orders_last_event_id" } },
    ],
  },
  {
    name: "staff_members",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "employee_code", "staff_name", "mobile_no", "designation", "status"],
        properties: {
          _id: { bsonType: "string" },
          employee_code: { bsonType: "string" },
          staff_name: { bsonType: "string" },
          mobile_no: { bsonType: "string" },
          email: { bsonType: ["string", "null"] },
          designation: { enum: ["accountant", "baker_chef", "delivery_person", "manager", "admin"] },
          status: { enum: ["active", "inactive", "suspended"] },
          permissions: { bsonType: ["array", "null"] },
        },
      },
    },
    indexes: [
      { keys: { employee_code: 1 }, options: { unique: true, name: "ux_staff_members_employee_code" } },
      { keys: { mobile_no: 1 }, options: { unique: true, name: "ux_staff_members_mobile_no" } },
      { keys: { email: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("email"), name: "ux_staff_members_email" } },
      { keys: { designation: 1, status: 1 }, options: { name: "ix_staff_members_designation_status" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_staff_members_last_event_id" } },
    ],
  },
  {
    name: "permissions",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "permission_code", "display_name", "is_active"],
        properties: {
          _id: { bsonType: "string" },
          permission_code: { bsonType: "string" },
          display_name: { bsonType: "string" },
          is_active: { bsonType: "bool" },
        },
      },
    },
    indexes: [
      { keys: { permission_code: 1 }, options: { unique: true, name: "ux_permissions_code" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_permissions_last_event_id" } },
    ],
  },
  {
    name: "staff_permissions",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "staff_id", "permission_code"],
        properties: {
          _id: { bsonType: "string" },
          staff_id: { bsonType: "string" },
          permission_code: { bsonType: "string" },
          revoked_at: { bsonType: ["date", "string", "null"] },
        },
      },
    },
    indexes: [
      { keys: { staff_id: 1, permission_code: 1 }, options: { name: "ix_staff_permissions_staff_permission" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_staff_permissions_last_event_id" } },
    ],
  },
  {
    name: "invoices",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "invoice_number", "user_id", "invoice_status"],
        properties: {
          _id: { bsonType: "string" },
          invoice_number: { bsonType: "string" },
          user_id: { bsonType: "string" },
          invoice_status: { enum: ["draft", "issued", "partially_paid", "paid", "overdue", "void", "cancelled"] },
          items: { bsonType: ["array", "null"] },
          payments: { bsonType: ["array", "null"] },
          receipts: { bsonType: ["array", "null"] },
        },
      },
    },
    indexes: [
      { keys: { invoice_number: 1 }, options: { unique: true, name: "ux_invoices_invoice_number" } },
      { keys: { user_id: 1, created_at: -1 }, options: { name: "ix_invoices_user_created" } },
      { keys: { invoice_status: 1, due_at: 1 }, options: { name: "ix_invoices_status_due" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_invoices_last_event_id" } },
    ],
  },
  {
    name: "payments",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "user_id", "amount", "currency_code", "payment_method", "payment_status"],
        properties: {
          _id: { bsonType: "string" },
          user_id: { bsonType: "string" },
          payment_status: {
            enum: [
              "pending",
              "processing",
              "authorized",
              "succeeded",
              "failed",
              "cancelled",
              "expired",
              "refunded",
              "partially_refunded",
            ],
          },
          failure_code: { bsonType: ["string", "null"] },
          failure_message: { bsonType: ["string", "null"] },
        },
      },
    },
    indexes: [
      { keys: { user_id: 1, created_at: -1 }, options: { name: "ix_payments_user_created" } },
      { keys: { invoice_id: 1, created_at: -1 }, options: { sparse: true, name: "ix_payments_invoice_created" } },
      { keys: { payment_status: 1, created_at: -1 }, options: { name: "ix_payments_status_created" } },
      {
        keys: { payment_provider: 1, provider_payment_id: 1 },
        options: {
          unique: true,
          partialFilterExpression: {
            payment_provider: { $type: "string" },
            provider_payment_id: { $type: "string" },
          },
          name: "ux_payments_provider_payment_id",
        },
      },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_payments_last_event_id" } },
    ],
  },
  {
    name: "receipts",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "receipt_number", "payment_id", "user_id", "amount"],
        properties: {
          _id: { bsonType: "string" },
          receipt_number: { bsonType: "string" },
          payment_id: { bsonType: "string" },
          user_id: { bsonType: "string" },
          receipt_status: { enum: ["issued", "void", null] },
        },
      },
    },
    indexes: [
      { keys: { receipt_number: 1 }, options: { unique: true, name: "ux_receipts_receipt_number" } },
      { keys: { payment_id: 1 }, options: { unique: true, name: "ux_receipts_payment_id" } },
      { keys: { user_id: 1, issued_at: -1 }, options: { name: "ix_receipts_user_issued" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_receipts_last_event_id" } },
    ],
  },
  {
    name: "guest_feedback",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "hotel_name", "room_number", "check_in_date", "check_out_date", "booking_method", "purpose_of_visit"],
        properties: {
          _id: { bsonType: "string" },
          hotel_name: { bsonType: "string" },
          room_number: { bsonType: "string" },
          guest_name: { bsonType: ["string", "null"] },
        },
      },
    },
    indexes: [
      { keys: { hotel_name: 1, created_at: -1 }, options: { name: "ix_guest_feedback_hotel_created" } },
      { keys: { created_at: -1 }, options: { name: "ix_guest_feedback_created" } },
      { keys: { last_event_id: 1 }, options: { unique: true, partialFilterExpression: optionalStringIndex("last_event_id"), name: "ux_guest_feedback_last_event_id" } },
    ],
  },
  {
    name: "outbox_events",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["_id", "postgres_event_id", "aggregate_type", "aggregate_id", "event_type"],
        properties: {
          _id: { bsonType: "string" },
          postgres_event_id: { bsonType: "string" },
          aggregate_type: { bsonType: "string" },
          aggregate_id: { bsonType: "string" },
          event_type: { bsonType: "string" },
        },
      },
    },
    indexes: [
      { keys: { postgres_event_id: 1 }, options: { unique: true, name: "ux_outbox_events_postgres_event_id" } },
      { keys: { aggregate_type: 1, aggregate_id: 1, created_at: 1 }, options: { name: "ix_outbox_events_aggregate" } },
    ],
  },
];

function optionalStringIndex(fieldName) {
  return { [fieldName]: { $type: "string" } };
}

async function ensureCollection(db, spec) {
  const existing = await db
    .listCollections({ name: spec.name }, { nameOnly: true })
    .toArray();

  const options = {
    validator: spec.validator,
    validationLevel: "moderate",
    validationAction: "error",
  };

  if (existing.length === 0) {
    await db.createCollection(spec.name, options);
    console.log(`Created collection ${spec.name}`);
  } else {
    await db.command({ collMod: spec.name, ...options });
    console.log(`Updated validator for ${spec.name}`);
  }

  const collection = db.collection(spec.name);
  for (const index of spec.indexes) {
    await collection.createIndex(index.keys, index.options);
  }
  console.log(`Ensured ${spec.indexes.length} indexes for ${spec.name}`);
}

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(databaseName);
    console.log(`Connected to MongoDB database ${databaseName}`);

    for (const spec of collectionSpecs) {
      await ensureCollection(db, spec);
    }

    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const found = new Set(collections.map((collection) => collection.name));
    const missing = collectionSpecs
      .map((spec) => spec.name)
      .filter((name) => !found.has(name));

    console.log(`Verified ${collectionSpecs.length - missing.length}/${collectionSpecs.length} collections.`);
    if (missing.length > 0) {
      console.error(`Missing collections: ${missing.join(", ")}`);
      process.exitCode = 2;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();

