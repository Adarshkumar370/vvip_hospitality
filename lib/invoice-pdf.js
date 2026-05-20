/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const os = require("os");
const path = require("path");

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
const RUPEE_SVG_PATH = "M153 23h41l15-23H55L40 23h26c27 0 52 2 62 25H55L40 71h91v1c0 17-14 43-60 43H48v22l90 113h41L85 133c39-2 75-24 80-62h29l15-23h-45c-1-9-5-18-11-25z";
const RUPEE_VIEWBOX = { x: 40, y: -1, width: 170, height: 251 };

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

function formatMoneyNumber(value) {
    return toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatMoney(value) {
    return `INR ${formatMoneyNumber(value)}`;
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

function textHeight(doc, value, width, options = {}) {
    const { font, size = 11, lineGap } = options;
    if (font) doc.font(font);
    doc.fontSize(size);
    return doc.heightOfString(String(value ?? ""), { width, lineGap });
}

function drawRupeeSymbol(doc, x, y, height, color = BLACK) {
    const scale = height / RUPEE_VIEWBOX.height;
    doc.save();
    doc.translate(x, y);
    doc.scale(scale);
    doc.translate(-RUPEE_VIEWBOX.x, -RUPEE_VIEWBOX.y);
    doc.path(RUPEE_SVG_PATH).fill(color);
    doc.restore();
    return RUPEE_VIEWBOX.width * scale;
}

function drawMoney(doc, value, x, y, width, options = {}) {
    const { font, size = 10, color = BLACK, align = "right" } = options;
    const amount = formatMoneyNumber(value);
    if (font) doc.font(font);
    doc.fontSize(size);
    const iconHeight = size * 0.9;
    const iconWidth = RUPEE_VIEWBOX.width * (iconHeight / RUPEE_VIEWBOX.height);
    const gap = Math.max(2, size * 0.2);
    const amountWidth = doc.widthOfString(amount);
    const contentWidth = iconWidth + gap + amountWidth;
    const startX = align === "right" ? x + width - contentWidth : x;
    const safeX = Math.max(x, startX);

    drawRupeeSymbol(doc, safeX, y + size * 0.1, iconHeight, color);
    text(doc, amount, safeX + iconWidth + gap, y, {
        font,
        size,
        color,
        width: Math.max(0, x + width - (safeX + iconWidth + gap)),
    });
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
    const right = 553;
    const tableWidth = right - left;
    const padX = 8;
    const padY = 7;
    const headerHeight = 24;
    const cells = {
        index: { x: left, width: 34 },
        name: { x: left + 34, width: 206 },
        qty: { x: left + 240, width: 58 },
        unit: { x: left + 298, width: 55 },
        price: { x: left + 353, width: 78 },
        amount: { x: left + 431, width: 80 },
    };
    const innerWidth = (cell) => Math.max(0, cell.width - padX * 2);
    const drawCellText = (value, cell, y, options = {}) => {
        text(doc, value, cell.x + padX, y + padY, { ...options, width: innerWidth(cell) });
    };
    const drawCellRightText = (value, cell, y, options = {}) => {
        rightText(doc, value, cell.x + padX, y + padY, innerWidth(cell), options);
    };
    const drawCellMoney = (value, cell, y, options = {}) => {
        drawMoney(doc, value, cell.x + padX, y + padY, innerWidth(cell), options);
    };
    const drawRowBorder = (y) => {
        doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor("#d8d8d8").stroke();
    };

    doc.rect(left, startY, tableWidth, headerHeight).fill(GOLD);
    drawCellText("#", cells.index, startY, { font: fonts.bold, size: 10, color: "#ffffff" });
    drawCellText("Item name", cells.name, startY, { font: fonts.bold, size: 10, color: "#ffffff" });
    drawCellRightText("Quantity", cells.qty, startY, { font: fonts.bold, size: 10, color: "#ffffff" });
    drawCellText("Unit", cells.unit, startY, { font: fonts.bold, size: 10, color: "#ffffff" });
    drawCellRightText("Price/ Unit", cells.price, startY, { font: fonts.bold, size: 10, color: "#ffffff" });
    drawCellRightText("Amount", cells.amount, startY, { font: fonts.bold, size: 10, color: "#ffffff" });

    let y = startY + headerHeight;
    invoice.items.forEach((item, index) => {
        const amount = toNumber(item.lineTotal ?? item.line_total);
        const itemName = item.name || item.item_name || "-";
        const unit = item.unitSymbol || item.unit_symbol || "Nos";
        const rowContentHeight = Math.max(
            textHeight(doc, itemName, innerWidth(cells.name), { font: fonts.bold, size: 10, lineGap: 2 }),
            textHeight(doc, formatQuantity(item.quantity), innerWidth(cells.qty), { font: fonts.regular, size: 10 }),
            textHeight(doc, unit, innerWidth(cells.unit), { font: fonts.regular, size: 10 }),
            12
        );
        const rowHeight = Math.max(32, rowContentHeight + padY * 2);

        if (index % 2 === 1) {
            doc.rect(left, y, tableWidth, rowHeight).fill("#fbfbfb");
        }
        drawRowBorder(y);
        drawCellText(String(index + 1), cells.index, y, { font: fonts.regular, size: 10 });
        drawCellText(itemName, cells.name, y, { font: fonts.bold, size: 10, lineGap: 2 });
        drawCellRightText(formatQuantity(item.quantity), cells.qty, y, { font: fonts.regular, size: 10 });
        drawCellText(unit, cells.unit, y, { font: fonts.regular, size: 10 });
        drawCellMoney(item.unitPrice ?? item.unit_price, cells.price, y, { font: fonts.regular, size: 10 });
        drawCellMoney(amount, cells.amount, y, { font: fonts.regular, size: 10 });
        y += rowHeight;
    });

    drawRowBorder(y);
    doc.rect(left, y, tableWidth, 32).fill("#f8f1e4");
    drawCellText("Total", cells.name, y, { font: fonts.bold, size: 10 });
    drawCellRightText(formatQuantity(invoice.items.reduce((sum, item) => sum + toNumber(item.quantity), 0)), cells.qty, y, { font: fonts.bold, size: 10 });
    drawCellMoney(invoice.totalAmount, cells.amount, y, { font: fonts.bold, size: 10 });
    drawRowBorder(y + 32);

    return y + 48;
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
    drawMoney(doc, invoice.subtotalAmount, 472, y, 78, { font: fonts.regular, size: 10 });

    doc.rect(rightX - 3, y + 26, 193, 24).fill(GOLD);
    text(doc, "Total", rightX + 2, y + 32, { font: fonts.bold, size: 10, color: "#ffffff" });
    drawMoney(doc, total, 472, y + 32, 78, { font: fonts.bold, size: 10, color: "#ffffff" });

    text(doc, "Received", rightX, y + 58, { font: fonts.regular, size: 10 });
    drawMoney(doc, paid, 472, y + 58, 78, { font: fonts.regular, size: 10 });
    text(doc, "Balance", rightX, y + 80, { font: fonts.regular, size: 10 });
    drawMoney(doc, balance, 472, y + 80, 78, { font: fonts.regular, size: 10 });
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

    // Loaded here (not at module top) so Turbopack's ESM interop wrapper is handled at call time
    const _pdfkit = require("pdfkit");
    const PDFDocument = _pdfkit.default || _pdfkit;

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

        const billToX = 46;
        const billToWidth = 310;
        const billToNameY = 270;
        const billingName = invoice.billingName || "Customer";
        const billingNameHeight = textHeight(doc, billingName, billToWidth, { font: fonts.bold, size: 11, lineGap: 2 });
        const billingAddressY = billToNameY + billingNameHeight + 14;
        const billingAddress = invoice.billingAddress || "-";
        const billingAddressHeight = textHeight(doc, billingAddress, billToWidth, { font: fonts.regular, size: 10, lineGap: 3 });

        text(doc, "Bill To", billToX, 246, { font: fonts.bold, size: 11 });
        text(doc, billingName, billToX, billToNameY, { font: fonts.bold, size: 11, width: billToWidth, lineGap: 2 });
        text(doc, billingAddress, billToX, billingAddressY, { font: fonts.regular, size: 10, width: billToWidth, lineGap: 3 });

        const invoiceDetailsX = 390;
        const invoiceDetailsWidth = 163;
        const invoiceNumberY = 270;
        const invoiceNumberText = `Invoice No. : ${invoice.invoiceNumber}`;
        const invoiceNumberHeight = textHeight(doc, invoiceNumberText, invoiceDetailsWidth, { font: fonts.regular, size: 10 });

        text(doc, "Invoice Details", 460, 246, { font: fonts.bold, size: 11, width: 95, align: "right" });
        rightText(doc, invoiceNumberText, invoiceDetailsX, invoiceNumberY, invoiceDetailsWidth, { font: fonts.regular, size: 10 });
        rightText(doc, `Date : ${formatDate(invoice.invoiceDate)}`, invoiceDetailsX, invoiceDateY, invoiceDetailsWidth, { font: fonts.regular, size: 10 });

        const billToBottomY = billingAddressY + billingAddressHeight;
        const invoiceDetailsBottomY = invoiceDateY + textHeight(doc, `Date : ${formatDate(invoice.invoiceDate)}`, invoiceDetailsWidth, { font: fonts.regular, size: 10 });
        const tableStartY = Math.max(320, billToBottomY, invoiceDetailsBottomY) + 18;

        const afterTableY = drawTable(doc, fonts, invoice, tableStartY);
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
