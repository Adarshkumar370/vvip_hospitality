/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const os = require("os");
const path = require("path");
const PDFDocument = require("pdfkit");

const COMPANY = {
    name: "VVIP HOSPITALITY LLP",
    addressLines: ["VVIP ADDRESSES 709, VVIP SUITES RAJ NAGAR", "EXTENSION GHAZIABAD"],
    phone: "9910412444",
    email: "vvipfoodsllp@gmail.com",
    gstin: "09AAUFV6459L1ZZ",
    state: "09-Uttar Pradesh",
};

const GOLD = "#d4a04f";
const BLACK = "#000000";
const GRAY = "#8a8a8a";
const BLUE_INK = "#314c9a";

function resolveAssetPath(relativePath) {
    return path.join(process.cwd(), relativePath);
}

function resolveFontPath(fileName) {
    const windowsPath = path.join("C:\\", "Windows", "Fonts", fileName);
    return fs.existsSync(windowsPath) ? windowsPath : null;
}

function registerFonts(doc) {
    const regular = resolveFontPath("NotoSans-Regular.ttf") || resolveFontPath("arial.ttf");
    const bold = resolveFontPath("NotoSans-Bold.ttf") || resolveFontPath("arialbd.ttf");
    const italic = resolveFontPath("NotoSans-Italic.ttf") || resolveFontPath("ariali.ttf");

    if (regular) doc.registerFont("InvoiceRegular", regular);
    if (bold) doc.registerFont("InvoiceBold", bold);
    if (italic) doc.registerFont("InvoiceItalic", italic);

    return {
        regular: regular ? "InvoiceRegular" : "Helvetica",
        bold: bold ? "InvoiceBold" : "Helvetica-Bold",
        italic: italic ? "InvoiceItalic" : "Helvetica-Oblique",
    };
}

function formatDate(dateLike) {
    const date = dateLike ? new Date(dateLike) : new Date();
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).formatToParts(date);
    const day = parts.find((part) => part.type === "day")?.value || "01";
    const month = parts.find((part) => part.type === "month")?.value || "01";
    const year = parts.find((part) => part.type === "year")?.value || "1970";
    return `${day}-${month}-${year}`;
}

function toNumber(value) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatQuantity(value) {
    const num = toNumber(value);
    return Number.isInteger(num) ? String(num) : num.toFixed(3).replace(/\.?0+$/, "");
}

function formatMoney(value) {
    return `₹ ${toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function numberToWordsIndian(amount) {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const twoDigits = (num) => {
        if (num < 20) return ones[num];
        return [tens[Math.floor(num / 10)], ones[num % 10]].filter(Boolean).join(" ");
    };
    const threeDigits = (num) => {
        const hundred = Math.floor(num / 100);
        const rest = num % 100;
        return [
            hundred ? `${ones[hundred]} Hundred` : "",
            rest ? twoDigits(rest) : "",
        ].filter(Boolean).join(" ");
    };

    let rupees = Math.round(toNumber(amount));
    if (rupees === 0) return "Zero Rupees only";

    const parts = [];
    const crore = Math.floor(rupees / 10000000);
    rupees %= 10000000;
    const lakh = Math.floor(rupees / 100000);
    rupees %= 100000;
    const thousand = Math.floor(rupees / 1000);
    rupees %= 1000;

    if (crore) parts.push(`${threeDigits(crore)} Crore`);
    if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
    if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
    if (rupees) parts.push(threeDigits(rupees));

    return `${parts.join(" ")} Rupees only`;
}

function text(doc, value, x, y, options = {}) {
    const { font, size = 11, color = BLACK, width, align, lineGap } = options;
    if (font) doc.font(font);
    doc.fontSize(size).fillColor(color).text(String(value ?? ""), x, y, {
        width,
        align,
        lineGap,
    });
}

function rightText(doc, value, x, y, width, options = {}) {
    text(doc, value, x, y, { ...options, width, align: "right" });
}

function drawSignature(doc, fonts, x, y) {
    const signaturePath = resolveAssetPath("public/canvas.png");
    if (fs.existsSync(signaturePath)) {
        doc.image(signaturePath, x, y, { width: 118 });
        text(doc, "Authorized Signatory", x + 2, y + 58, { font: fonts.bold, size: 11 });
        return;
    }

    doc.save();
    doc.rect(x, y, 116, 44).fill("#eeeeee");
    doc.lineWidth(1.4).strokeColor(BLUE_INK);
    doc.moveTo(x + 8, y + 35)
        .bezierCurveTo(x + 35, y + 31, x + 36, y + 3, x + 44, y + 4)
        .bezierCurveTo(x + 62, y + 9, x + 30, y + 46, x + 58, y + 26)
        .bezierCurveTo(x + 76, y + 12, x + 74, y + 32, x + 88, y + 22)
        .bezierCurveTo(x + 95, y + 17, x + 98, y + 23, x + 109, y + 18)
        .stroke();
    doc.restore();
    text(doc, "Authorized Signatory", x + 2, y + 58, { font: fonts.bold, size: 11 });
}

function drawTable(doc, fonts, invoice, startY) {
    const left = 42;
    const right = 548;
    const tableWidth = right - left;
    const columns = {
        index: left + 4,
        name: left + 30,
        qtyX: left + 258,
        unit: left + 318,
        priceX: left + 356,
        amountX: left + 430,
    };
    const widths = {
        name: 205,
        qty: 48,
        unit: 45,
        price: 72,
        amount: 76,
    };

    doc.rect(left, startY, tableWidth, 22).fill(GOLD);
    text(doc, "#", columns.index, startY + 5, { font: fonts.bold, size: 10, color: "#ffffff" });
    text(doc, "Item name", columns.name, startY + 5, { font: fonts.bold, size: 10, color: "#ffffff" });
    rightText(doc, "Quantity", columns.qtyX, startY + 5, widths.qty, { font: fonts.bold, size: 10, color: "#ffffff" });
    text(doc, "Unit", columns.unit, startY + 5, { font: fonts.bold, size: 10, color: "#ffffff" });
    rightText(doc, "Price/ Unit", columns.priceX, startY + 5, widths.price, { font: fonts.bold, size: 10, color: "#ffffff" });
    rightText(doc, "Amount", columns.amountX, startY + 5, widths.amount, { font: fonts.bold, size: 10, color: "#ffffff" });

    let y = startY + 30;
    invoice.items.forEach((item, index) => {
        const amount = toNumber(item.lineTotal ?? item.line_total);
        const itemName = item.name || item.item_name;
        doc.font(fonts.bold).fontSize(10);
        const rowHeight = Math.max(22, doc.heightOfString(itemName, { width: widths.name }) + 8);
        text(doc, String(index + 1), columns.index, y, { font: fonts.regular, size: 10 });
        text(doc, itemName, columns.name, y, { font: fonts.bold, size: 10, width: widths.name });
        rightText(doc, formatQuantity(item.quantity), columns.qtyX, y, widths.qty, { font: fonts.regular, size: 10 });
        text(doc, item.unitSymbol || item.unit_symbol || "Nos", columns.unit, y, { font: fonts.regular, size: 10 });
        rightText(doc, formatMoney(item.unitPrice ?? item.unit_price), columns.priceX, y, widths.price, { font: fonts.regular, size: 10 });
        rightText(doc, formatMoney(amount), columns.amountX, y, widths.amount, { font: fonts.regular, size: 10 });
        y += rowHeight;
    });

    doc.moveTo(left, y - 4).lineTo(right, y - 4).lineWidth(0.7).strokeColor(GRAY).stroke();
    text(doc, "Total", columns.name, y + 4, { font: fonts.bold, size: 10 });
    rightText(doc, formatQuantity(invoice.items.reduce((sum, item) => sum + toNumber(item.quantity), 0)), columns.qtyX, y + 4, widths.qty, { font: fonts.bold, size: 10 });
    rightText(doc, formatMoney(invoice.totalAmount), columns.amountX, y + 4, widths.amount, { font: fonts.bold, size: 10 });
    doc.moveTo(left, y + 22).lineTo(right, y + 22).lineWidth(0.7).strokeColor(GRAY).stroke();

    return y + 44;
}

function drawTotals(doc, fonts, invoice, y) {
    const leftX = 42;
    const rightX = 360;
    const total = toNumber(invoice.totalAmount);
    const paid = toNumber(invoice.paidAmount);
    const balance = Math.max(total - paid, 0);

    text(doc, "Invoice Amount In Words", leftX, y, { font: fonts.bold, size: 11 });
    text(doc, numberToWordsIndian(total), leftX, y + 22, { font: fonts.regular, size: 10, width: 300 });

    text(doc, "Sub Total", rightX, y, { font: fonts.regular, size: 10 });
    rightText(doc, formatMoney(invoice.subtotalAmount), 472, y, 78, { font: fonts.regular, size: 10 });

    doc.rect(rightX - 3, y + 26, 193, 24).fill(GOLD);
    text(doc, "Total", rightX + 2, y + 32, { font: fonts.bold, size: 10, color: "#ffffff" });
    rightText(doc, formatMoney(total), 472, y + 32, 78, { font: fonts.bold, size: 10, color: "#ffffff" });

    text(doc, "Received", rightX, y + 58, { font: fonts.regular, size: 10 });
    rightText(doc, formatMoney(paid), 472, y + 58, 78, { font: fonts.regular, size: 10 });
    text(doc, "Balance", rightX, y + 80, { font: fonts.regular, size: 10 });
    rightText(doc, formatMoney(balance), 472, y + 80, 78, { font: fonts.regular, size: 10 });
    doc.moveTo(rightX - 3, y + 98).lineTo(553, y + 98).lineWidth(0.7).strokeColor(GRAY).stroke();
}

function drawFooter(doc, fonts, invoice, y) {
    const leftX = 42;
    const rightX = 355;

    text(doc, "Terms and Conditions", leftX, y, { font: fonts.bold, size: 11 });
    text(doc, "Thanks for doing business with us!", leftX, y + 23, { font: fonts.regular, size: 10 });

    text(doc, `For :${COMPANY.name}`, rightX, y + 58, { font: fonts.regular, size: 10 });
    drawSignature(doc, fonts, rightX + 8, y + 82);

    text(doc, `Order ID: ${invoice.orderId}`, leftX, 812, { font: fonts.regular, size: 7, color: "#666666", width: 500 });
}

function createLocalInvoicePath(invoiceNumber) {
    const safeName = String(invoiceNumber || `invoice-${Date.now()}`).replace(/[^a-z0-9_-]+/gi, "-");
    return path.join(os.tmpdir(), "local-invoices", `${safeName}.pdf`);
}

function renderInvoicePdf(invoice, outputPath = createLocalInvoicePath(invoice.invoiceNumber)) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 0, compress: true });
        const stream = fs.createWriteStream(outputPath);
        const fonts = registerFonts(doc);

        stream.on("finish", () => resolve(outputPath));
        stream.on("error", reject);
        doc.on("error", reject);
        doc.pipe(stream);

        doc.font(fonts.regular);
        const logoPath = resolveAssetPath("public/images/bakery_logo.jpeg");

        text(doc, COMPANY.name, 46, 45, { font: fonts.bold, size: 16 });
        text(doc, COMPANY.addressLines[0], 46, 72, { font: fonts.regular, size: 10 });
        text(doc, COMPANY.addressLines[1], 46, 86, { font: fonts.regular, size: 10 });
        text(doc, `Phone no. : ${COMPANY.phone}`, 46, 108, { font: fonts.regular, size: 10 });
        text(doc, `Email : ${COMPANY.email}`, 46, 126, { font: fonts.regular, size: 10 });
        text(doc, `GSTIN : ${COMPANY.gstin}`, 46, 144, { font: fonts.regular, size: 10 });
        text(doc, `State: ${COMPANY.state}`, 46, 162, { font: fonts.regular, size: 10 });

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 470, 58, { width: 96 });
        }

        doc.moveTo(42, 188).lineTo(553, 188).lineWidth(0.8).strokeColor(GOLD).stroke();
        text(doc, "Tax Invoice", 0, 204, { font: fonts.bold, size: 18, color: GOLD, width: 595, align: "center" });

        text(doc, "Bill To", 46, 246, { font: fonts.bold, size: 11 });
        text(doc, invoice.billingName, 46, 270, { font: fonts.bold, size: 11 });
        text(doc, invoice.billingAddress || "-", 46, 294, { font: fonts.regular, size: 10, width: 310, lineGap: 3 });

        text(doc, "Invoice Details", 460, 246, { font: fonts.bold, size: 11, width: 95, align: "right" });
        rightText(doc, `Invoice No. : ${invoice.invoiceNumber}`, 390, 270, 163, { font: fonts.regular, size: 10 });
        rightText(doc, `Date : ${formatDate(invoice.invoiceDate)}`, 390, 294, 163, { font: fonts.regular, size: 10 });

        const afterTableY = drawTable(doc, fonts, invoice, 320);
        const totalsY = Math.max(afterTableY, 456);
        drawTotals(doc, fonts, invoice, totalsY);
        drawFooter(doc, fonts, invoice, totalsY + 132);

        doc.end();
    });
}

module.exports = {
    createLocalInvoicePath,
    formatMoney,
    numberToWordsIndian,
    renderInvoicePdf,
};
