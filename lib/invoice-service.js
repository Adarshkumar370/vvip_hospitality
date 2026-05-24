/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { createLocalInvoicePath, renderInvoicePdf } = require("./invoice-pdf");

const s3RequestTimeoutMs = getTimeoutMs("S3_REQUEST_TIMEOUT_MS", 15_000);
const s3ConnectionTimeoutMs = getTimeoutMs("S3_CONNECTION_TIMEOUT_MS", 5_000);

function getTimeoutMs(envName, fallbackMs) {
    const value = Number(process.env[envName]);
    return Number.isFinite(value) && value > 0 ? value : fallbackMs;
}

function getInvoiceBucket() {
    return process.env.SUPABASE_INVOICE_BUCKET || "invoices";
}

function getS3Client() {
    return new S3Client({
        forcePathStyle: true,
        region: process.env.SUPABASE_S3_REGION || "ap-south-1",
        endpoint: process.env.SUPABASE_S3_ENDPOINT,
        requestHandler: {
            connectionTimeout: s3ConnectionTimeoutMs,
            requestTimeout: s3RequestTimeoutMs,
            socketTimeout: s3RequestTimeoutMs,
        },
        credentials: {
            accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || "",
        },
    });
}

function toNumber(value) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function compactAddress(snapshot) {
    if (!snapshot) return "";
    const parts = [
        snapshot.line1,
        snapshot.line2,
        snapshot.city,
        snapshot.state,
        snapshot.postal_code,
    ].filter(Boolean);
    return parts.join(", ");
}

function getPublicInvoiceUrl(bucket, key) {
    if (process.env.SUPABASE_PUBLIC_STORAGE_URL) {
        return `${process.env.SUPABASE_PUBLIC_STORAGE_URL.replace(/\/$/, "")}/${bucket}/${key}`;
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${key}`;
    }

    if (process.env.SUPABASE_PROJECT_ID) {
        return `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${bucket}/${key}`;
    }

    throw new Error("SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_URL is required to build the public invoice URL");
}

function createInvoiceObjectKey(invoiceNumber) {
    const safeName = String(invoiceNumber || `invoice-${Date.now()}`).replace(/[^a-z0-9_-]+/gi, "-");
    return `${safeName}.pdf`;
}

async function ensurePaidOrderInvoice(db, orderId) {
    return db.begin(async (tx) => {
        const [order] = await tx`
            SELECT *
            FROM orders
            WHERE id = ${orderId}
        `;
        if (!order) throw new Error("Order not found");

        const [paymentSummary] = await tx`
            SELECT COALESCE(SUM(amount), 0) AS paid_amount
            FROM payments
            WHERE order_id = ${orderId}
              AND payment_status = 'succeeded'
        `;
        const paidAmount = toNumber(paymentSummary?.paid_amount);
        if (paidAmount <= 0 && order.payment_type_snapshot !== "postpaid_user") {
            throw new Error("Invoice can only be generated for a paid order");
        }

        const [existingInvoice] = await tx`
            SELECT *
            FROM invoices
            WHERE order_id = ${orderId}
            ORDER BY created_at ASC
            LIMIT 1
        `;

        const totalAmount = toNumber(order.total_amount);
        const dueAmount = Math.max(totalAmount - paidAmount, 0);
        const addressSnapshot = order.delivery_address_snapshot || null;

        const [invoice] = existingInvoice
            ? await tx`
                UPDATE invoices
                SET invoice_status = ${dueAmount <= 0 ? "paid" : "issued"},
                    subtotal_amount = ${order.subtotal_amount},
                    discount_amount = ${order.discount_amount},
                    tax_amount = ${order.tax_amount},
                    shipping_amount = ${order.delivery_fee_amount},
                    adjustment_amount = ${order.adjustment_amount},
                    total_amount = ${order.total_amount},
                    paid_amount = ${paidAmount},
                    due_amount = ${dueAmount},
                    issued_at = COALESCE(issued_at, now()),
                    paid_at = CASE WHEN ${dueAmount} <= 0 THEN COALESCE(paid_at, now()) ELSE paid_at END,
                    billing_name = ${order.customer_name},
                    billing_email = ${order.customer_email},
                    billing_mobile_no = ${order.customer_mobile_no},
                    billing_address_snapshot = ${addressSnapshot}
                WHERE id = ${existingInvoice.id}
                RETURNING *
            `
            : await tx`
                INSERT INTO invoices (
                    user_id, order_id, invoice_status, currency_code,
                    subtotal_amount, discount_amount, tax_amount, shipping_amount,
                    adjustment_amount, total_amount, paid_amount, due_amount,
                    issued_at, paid_at, billing_name, billing_email, billing_mobile_no,
                    billing_address_snapshot, notes
                )
                VALUES (
                    ${order.user_id}, ${order.id}, ${dueAmount <= 0 ? "paid" : "issued"}, ${order.currency_code || "INR"},
                    ${order.subtotal_amount}, ${order.discount_amount}, ${order.tax_amount}, ${order.delivery_fee_amount},
                    ${order.adjustment_amount}, ${order.total_amount}, ${paidAmount}, ${dueAmount},
                    now(), ${dueAmount <= 0 ? tx`now()` : null}, ${order.customer_name}, ${order.customer_email}, ${order.customer_mobile_no},
                    ${addressSnapshot}, 'Auto-issued after successful payment'
                )
                RETURNING *
            `;

        const [itemCount] = await tx`
            SELECT COUNT(*)::int AS count
            FROM invoice_items
            WHERE invoice_id = ${invoice.id}
        `;

        if (Number(itemCount.count) === 0) {
            await tx`
                INSERT INTO invoice_items (
                    invoice_id, product_id, order_item_id, line_number,
                    item_name, item_description, unit_code, unit_symbol,
                    quantity, unit_price, discount_amount, tax_amount
                )
                SELECT
                    ${invoice.id}, product_id, id, line_number,
                    product_name_snapshot, category_name_snapshot, unit_code_snapshot, unit_symbol_snapshot,
                    quantity, unit_price, discount_amount, tax_amount
                FROM order_items
                WHERE order_id = ${order.id}
                ORDER BY line_number
            `;
        }

        await tx`
            UPDATE payments
            SET invoice_id = ${invoice.id}
            WHERE order_id = ${order.id}
              AND payment_status = 'succeeded'
              AND invoice_id IS NULL
        `;

        await tx`
            UPDATE receipts
            SET invoice_id = ${invoice.id}
            WHERE invoice_id IS NULL
              AND payment_id IN (
                SELECT id
                FROM payments
                WHERE order_id = ${order.id}
                  AND payment_status = 'succeeded'
              )
        `;

        return invoice;
    });
}

async function getInvoicePdfPayload(db, invoiceId) {
    const [invoice] = await db`
        SELECT i.*, o.order_number, o.delivery_address_snapshot, o.created_at AS order_created_at
        FROM invoices i
        JOIN orders o ON o.id = i.order_id
        WHERE i.id = ${invoiceId}
    `;
    if (!invoice) throw new Error("Invoice not found");

    const items = await db`
        SELECT *
        FROM invoice_items
        WHERE invoice_id = ${invoice.id}
        ORDER BY line_number
    `;

    return {
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.issued_at || invoice.created_at,
        orderId: invoice.order_id,
        orderNumber: invoice.order_number,
        billingName: invoice.billing_name || "Customer",
        billingAddress: compactAddress(invoice.billing_address_snapshot || invoice.delivery_address_snapshot),
        subtotalAmount: invoice.subtotal_amount,
        totalAmount: invoice.total_amount,
        paidAmount: invoice.paid_amount,
        items: items.map((item) => ({
            name: item.item_name,
            quantity: item.quantity,
            unitSymbol: item.unit_symbol,
            unitPrice: item.unit_price,
            lineTotal: item.line_total,
        })),
    };
}

async function generateLocalInvoicePdfForOrder(db, orderId, options = {}) {
    const invoice = await ensurePaidOrderInvoice(db, orderId);
    const payload = await getInvoicePdfPayload(db, invoice.id);
    const outputPath = options.outputPath || createLocalInvoicePath(payload.invoiceNumber);
    await renderInvoicePdf(payload, outputPath);

    return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        outputPath,
    };
}

async function uploadInvoicePdf(db, invoiceId, pdfPath, invoiceNumber) {
    const bucket = getInvoiceBucket();
    const key = createInvoiceObjectKey(invoiceNumber);
    const absolutePath = path.resolve(process.cwd(), pdfPath);
    const pdfBuffer = fs.readFileSync(absolutePath);

    await getS3Client().send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        CacheControl: "private, max-age=0, no-cache",
    }));

    const publicUrl = getPublicInvoiceUrl(bucket, key);
    const [invoice] = await db`
        UPDATE invoices
        SET invoice_pdf_bucket = ${bucket},
            invoice_pdf_key = ${key},
            invoice_pdf_url = ${publicUrl},
            invoice_pdf_uploaded_at = now()
        WHERE id = ${invoiceId}
        RETURNING id, invoice_number, invoice_pdf_url
    `;

    return {
        bucket,
        key,
        url: invoice?.invoice_pdf_url || publicUrl,
    };
}

async function generateAndUploadInvoicePdfForOrder(db, orderId, options = {}) {
    const localInvoice = await generateLocalInvoicePdfForOrder(db, orderId, options);
    const upload = await uploadInvoicePdf(db, localInvoice.invoiceId, localInvoice.outputPath, localInvoice.invoiceNumber);

    return {
        ...localInvoice,
        invoicePdfUrl: upload.url,
        invoicePdfKey: upload.key,
        invoicePdfBucket: upload.bucket,
    };
}

module.exports = {
    ensurePaidOrderInvoice,
    generateAndUploadInvoicePdfForOrder,
    generateLocalInvoicePdfForOrder,
    getInvoicePdfPayload,
    uploadInvoicePdf,
};
