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
    stateName: "Uttar Pradesh",
};

const GOLD = "#d4a04f";
const GOLD_SOFT = "#f8f1e4";
const BLACK = "#1a1a1a";
const GRAY = "#8a8a8a";
const LIGHT_RULE = "#e0e0e0";
const BLUE_INK = "#314c9a";
const RUPEE_SVG_PATH = "M153 23h41l15-23H55L40 23h26c27 0 52 2 62 25H55L40 71h91v1c0 17-14 43-60 43H48v22l90 113h41L85 133c39-2 75-24 80-62h29l15-23h-45c-1-9-5-18-11-25z";
const RUPEE_VIEWBOX = { x: 40, y: -1, width: 170, height: 251 };

const PAGE = {
    width: 595,
    left: 42,
    right: 553,
    bottom: 792,
};
PAGE.innerWidth = PAGE.right - PAGE.left;

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

function roundMoney(value) {
    return Math.round(toNumber(value) * 100) / 100;
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
    const integerWords = (value) => {
        const parts = [];
        let rest = value;
        const crore = Math.floor(rest / 10000000);
        rest %= 10000000;
        const lakh = Math.floor(rest / 100000);
        rest %= 100000;
        const thousand = Math.floor(rest / 1000);
        rest %= 1000;

        if (crore) parts.push(`${threeDigits(crore)} Crore`);
        if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
        if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
        if (rest) parts.push(threeDigits(rest));
        return parts.join(" ");
    };

    const totalPaise = Math.round(toNumber(amount) * 100);
    const rupees = Math.floor(totalPaise / 100);
    const paise = totalPaise % 100;

    if (rupees === 0 && paise === 0) return "Zero Rupees only";

    const segments = [];
    if (rupees) segments.push(`${integerWords(rupees)} Rupees`);
    else segments.push("Zero Rupees");
    if (paise) segments.push(`and ${twoDigits(paise)} Paise`);
    return `${segments.join(" ")} only`;
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
    const { font, size = 10, color = BLACK, align = "right", negative = false } = options;
    const amount = formatMoneyNumber(Math.abs(toNumber(value)));
    const prefix = negative || toNumber(value) < 0 ? "- " : "";
    if (font) doc.font(font);
    doc.fontSize(size);
    const iconHeight = size * 0.9;
    const iconWidth = RUPEE_VIEWBOX.width * (iconHeight / RUPEE_VIEWBOX.height);
    const gap = Math.max(2, size * 0.2);
    const prefixWidth = prefix ? doc.widthOfString(prefix) : 0;
    const amountWidth = doc.widthOfString(amount);
    const contentWidth = prefixWidth + iconWidth + gap + amountWidth;
    const startX = align === "right" ? x + width - contentWidth : x;
    const safeX = Math.max(x, startX);

    if (prefix) {
        text(doc, prefix.trim(), safeX, y, { font, size, color });
    }
    drawRupeeSymbol(doc, safeX + prefixWidth, y + size * 0.1, iconHeight, color);
    text(doc, amount, safeX + prefixWidth + iconWidth + gap, y, {
        font,
        size,
        color,
        width: Math.max(0, x + width - (safeX + prefixWidth + iconWidth + gap)),
    });
}

function drawSignature(doc, fonts, x, y) {
    const signaturePath = resolveAssetPath("public/canvas.png");
    if (fs.existsSync(signaturePath)) {
        doc.image(signaturePath, x, y, { width: 118 });
        text(doc, "Authorized Signatory", x + 2, y + 58, { font: fonts.bold, size: 10 });
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
    text(doc, "Authorized Signatory", x + 2, y + 58, { font: fonts.bold, size: 10 });
}

function formatOrderDisplayNumber(invoice) {
    if (invoice.orderNumber) {
        const match = String(invoice.orderNumber).match(/(\d+)$/);
        if (match) return String(Number(match[1]));
        return String(invoice.orderNumber);
    }

    return formatNumericFallbackId(invoice.orderId);
}

function formatNumericFallbackId(id) {
    if (id == null) return "";

    const raw = String(id);
    const digits = raw.replace(/\D/g, "");
    if (digits) return String(Number(digits.slice(-8)));

    let hash = 0;
    for (let index = 0; index < raw.length; index += 1) {
        hash = (hash * 31 + raw.charCodeAt(index)) % 100000000;
    }

    return String(hash);
}

function normalizeStateName(value) {
    return String(value || "").toLowerCase().replace(/^\d+\s*[-–]\s*/, "").trim();
}

// Prices are GST-inclusive; the GST portion of each line is line_total * r / (100 + r).
function computeGstDetails(invoice) {
    const buyerState = normalizeStateName(invoice.placeOfSupply);
    const isInterState = Boolean(buyerState) && buyerState !== normalizeStateName(COMPANY.stateName);

    const lines = (invoice.items || []).map((item) => {
        const gross = toNumber(item.lineTotal ?? item.line_total);
        const rate = toNumber(item.gstRate ?? item.gst_rate);
        const tax = rate > 0 ? roundMoney((gross * rate) / (100 + rate)) : 0;
        return { gross, rate, tax, taxable: roundMoney(gross - tax) };
    });

    const rateGroups = new Map();
    lines.forEach((line) => {
        if (line.rate <= 0) return;
        rateGroups.set(line.rate, roundMoney((rateGroups.get(line.rate) || 0) + line.tax));
    });

    return {
        isInterState,
        lines,
        rateGroups: [...rateGroups.entries()].sort((a, b) => a[0] - b[0]),
        taxableTotal: roundMoney(lines.reduce((sum, line) => sum + line.taxable, 0)),
        taxTotal: roundMoney(lines.reduce((sum, line) => sum + line.tax, 0)),
    };
}

function formatRate(rate) {
    const num = toNumber(rate);
    return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function createLocalInvoicePath(invoiceNumber) {
    const safeName = String(invoiceNumber || `invoice-${Date.now()}`).replace(/[^a-z0-9_-]+/gi, "-");
    return path.join(os.tmpdir(), "local-invoices", `${safeName}.pdf`);
}

function drawContinuationHeader(doc, fonts, invoice) {
    text(doc, COMPANY.name, PAGE.left, 40, { font: fonts.bold, size: 12 });
    rightText(doc, `Tax Invoice ${invoice.invoiceNumber} (continued)`, PAGE.left, 42, PAGE.innerWidth, { font: fonts.regular, size: 9, color: GRAY });
    doc.moveTo(PAGE.left, 62).lineTo(PAGE.right, 62).lineWidth(0.8).strokeColor(GOLD).stroke();
    return 76;
}

function createFlow(doc, fonts, invoice, startY) {
    const flow = { y: startY };
    flow.ensureSpace = (height) => {
        if (flow.y + height <= PAGE.bottom) return false;
        doc.addPage();
        flow.y = drawContinuationHeader(doc, fonts, invoice);
        return true;
    };
    return flow;
}

function drawFirstPageHeader(doc, fonts) {
    const logoPath = resolveAssetPath("public/images/bakery_logo.jpeg");

    text(doc, COMPANY.name, 46, 45, { font: fonts.bold, size: 16 });
    text(doc, COMPANY.addressLines[0], 46, 72, { font: fonts.regular, size: 10 });
    text(doc, COMPANY.addressLines[1], 46, 86, { font: fonts.regular, size: 10 });
    text(doc, `Phone no. : ${COMPANY.phone}`, 46, 108, { font: fonts.regular, size: 10 });
    text(doc, `Email : ${COMPANY.email}`, 46, 126, { font: fonts.regular, size: 10 });
    text(doc, `GSTIN : ${COMPANY.gstin}`, 46, 144, { font: fonts.regular, size: 10 });
    text(doc, `State : ${COMPANY.state}`, 46, 162, { font: fonts.regular, size: 10 });

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 470, 58, { width: 96 });
    }

    doc.moveTo(PAGE.left, 188).lineTo(PAGE.right, 188).lineWidth(0.8).strokeColor(GOLD).stroke();
    text(doc, "Tax Invoice", 0, 200, { font: fonts.bold, size: 18, color: GOLD, width: PAGE.width, align: "center" });
    rightText(doc, "ORIGINAL FOR RECIPIENT", PAGE.left, 206, PAGE.innerWidth, { font: fonts.regular, size: 7, color: GRAY });

    return 238;
}

function drawParties(doc, fonts, invoice, startY) {
    const leftX = 46;
    const leftWidth = 290;
    const rightX = 360;
    const rightWidth = PAGE.right - rightX;
    const lineSpacing = 4;

    text(doc, "Bill To", leftX, startY, { font: fonts.bold, size: 11, color: GOLD });
    text(doc, "Invoice Details", rightX, startY, { font: fonts.bold, size: 11, color: GOLD, width: rightWidth, align: "right" });
    doc.moveTo(leftX, startY + 18).lineTo(leftX + leftWidth, startY + 18).lineWidth(0.5).strokeColor(LIGHT_RULE).stroke();
    doc.moveTo(rightX, startY + 18).lineTo(PAGE.right, startY + 18).lineWidth(0.5).strokeColor(LIGHT_RULE).stroke();

    let leftY = startY + 26;
    const leftLines = [];
    leftLines.push({ value: invoice.billingName || "Customer", options: { font: fonts.bold, size: 11, lineGap: 2 } });
    if (invoice.billingAddress) {
        leftLines.push({ value: invoice.billingAddress, options: { font: fonts.regular, size: 10, lineGap: 3 } });
    }
    if (invoice.billingMobile) {
        leftLines.push({ value: `Contact No. : ${invoice.billingMobile}`, options: { font: fonts.regular, size: 10 } });
    }
    if (invoice.billingEmail) {
        leftLines.push({ value: `Email : ${invoice.billingEmail}`, options: { font: fonts.regular, size: 10 } });
    }
    leftLines.forEach((line) => {
        text(doc, line.value, leftX, leftY, { ...line.options, width: leftWidth });
        leftY += textHeight(doc, line.value, leftWidth, line.options) + lineSpacing;
    });

    let rightY = startY + 26;
    const rightLines = [
        `Invoice No. : ${invoice.invoiceNumber}`,
        `Date : ${formatDate(invoice.invoiceDate)}`,
        `Order No. : #${formatOrderDisplayNumber(invoice)}`,
        `Place of Supply : ${invoice.placeOfSupply || COMPANY.stateName}`,
    ];
    rightLines.forEach((line) => {
        rightText(doc, line, rightX, rightY, rightWidth, { font: fonts.regular, size: 10 });
        rightY += textHeight(doc, line, rightWidth, { font: fonts.regular, size: 10 }) + lineSpacing;
    });

    return Math.max(leftY, rightY) + 12;
}

function drawItemsTable(doc, fonts, invoice, gst, flow) {
    const padX = 7;
    const padY = 6;
    const headerHeight = 22;
    const left = PAGE.left;
    const cells = {
        index: { x: left, width: 24 },
        name: { x: left + 24, width: 140 },
        hsn: { x: left + 164, width: 38 },
        qty: { x: left + 202, width: 34 },
        unit: { x: left + 236, width: 46 },
        price: { x: left + 282, width: 75 },
        gst: { x: left + 357, width: 74 },
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
        doc.moveTo(left, y).lineTo(PAGE.right, y).lineWidth(0.5).strokeColor(LIGHT_RULE).stroke();
    };
    const headerCell = (label, cell, y, align = "left") => {
        if (align === "right") drawCellRightText(label, cell, y, { font: fonts.bold, size: 9.5, color: "#ffffff" });
        else drawCellText(label, cell, y, { font: fonts.bold, size: 9.5, color: "#ffffff" });
    };
    const drawTableHeader = () => {
        doc.rect(left, flow.y, PAGE.innerWidth, headerHeight).fill(GOLD);
        headerCell("#", cells.index, flow.y);
        headerCell("Item name", cells.name, flow.y);
        headerCell("HSN", cells.hsn, flow.y);
        headerCell("Qty", cells.qty, flow.y, "right");
        headerCell("Unit", cells.unit, flow.y);
        headerCell("Price/ Unit", cells.price, flow.y, "right");
        headerCell("GST", cells.gst, flow.y, "right");
        headerCell("Amount", cells.amount, flow.y, "right");
        flow.y += headerHeight;
    };

    flow.ensureSpace(headerHeight + 64);
    drawTableHeader();

    let totalQuantity = 0;
    invoice.items.forEach((item, index) => {
        const line = gst.lines[index];
        const itemName = item.name || item.item_name || "-";
        const unit = item.unitSymbol || item.unit_symbol || "Nos";
        const quantity = toNumber(item.quantity);
        const unitPriceExcl = quantity > 0 ? line.taxable / quantity : line.taxable;
        totalQuantity += quantity;

        const gstCellHeight = line.rate > 0 ? 24 : 12;
        const rowContentHeight = Math.max(
            textHeight(doc, itemName, innerWidth(cells.name), { font: fonts.bold, size: 9.5, lineGap: 2 }),
            textHeight(doc, unit, innerWidth(cells.unit), { font: fonts.regular, size: 9.5 }),
            gstCellHeight,
            12
        );
        const rowHeight = Math.max(26, rowContentHeight + padY * 2);

        if (flow.ensureSpace(rowHeight)) {
            drawTableHeader();
        }
        const y = flow.y;
        if (index % 2 === 1) {
            doc.rect(left, y, PAGE.innerWidth, rowHeight).fill("#fbfbfb");
        }
        drawCellText(String(index + 1), cells.index, y, { font: fonts.regular, size: 9.5 });
        drawCellText(itemName, cells.name, y, { font: fonts.bold, size: 9.5, lineGap: 2 });
        drawCellText(item.hsnCode || item.hsn_code || "-", cells.hsn, y, { font: fonts.regular, size: 9.5 });
        drawCellRightText(formatQuantity(item.quantity), cells.qty, y, { font: fonts.regular, size: 9.5 });
        drawCellText(unit, cells.unit, y, { font: fonts.regular, size: 9.5 });
        drawCellMoney(unitPriceExcl, cells.price, y, { font: fonts.regular, size: 9.5 });
        drawCellMoney(line.tax, cells.gst, y, { font: fonts.regular, size: 9.5 });
        if (line.rate > 0) {
            drawCellRightText(`(${formatRate(line.rate)}%)`, cells.gst, y + 12, { font: fonts.regular, size: 7.5, color: GRAY });
        }
        drawCellMoney(line.gross, cells.amount, y, { font: fonts.regular, size: 9.5 });
        drawRowBorder(y + rowHeight);
        flow.y += rowHeight;
    });

    const totalRowHeight = 28;
    if (flow.ensureSpace(totalRowHeight)) {
        drawTableHeader();
    }
    doc.rect(left, flow.y, PAGE.innerWidth, totalRowHeight).fill(GOLD_SOFT);
    drawCellText("Total", cells.name, flow.y, { font: fonts.bold, size: 9.5 });
    drawCellRightText(formatQuantity(totalQuantity), cells.qty, flow.y, { font: fonts.bold, size: 9.5 });
    drawCellMoney(gst.taxTotal, cells.gst, flow.y, { font: fonts.bold, size: 9.5 });
    drawCellMoney(invoice.totalAmount, cells.amount, flow.y, { font: fonts.bold, size: 9.5 });
    drawRowBorder(flow.y + totalRowHeight);
    flow.y += totalRowHeight + 16;
}

function drawSummary(doc, fonts, invoice, gst, flow) {
    const leftX = 46;
    const leftWidth = 290;
    const labelX = 360;
    const valueWidth = 110;
    const valueX = PAGE.right - valueWidth;
    const rowHeight = 18;
    const bandHeight = 24;

    const total = toNumber(invoice.totalAmount);
    const paid = toNumber(invoice.paidAmount);
    const balance = invoice.dueAmount != null ? toNumber(invoice.dueAmount) : Math.max(total - paid, 0);
    const shipping = toNumber(invoice.shippingAmount);
    const adjustment = toNumber(invoice.adjustmentAmount);

    const rowsBeforeTotal = [{ label: "Taxable Amount", value: gst.taxableTotal }];
    if (gst.rateGroups.length === 0) {
        if (gst.isInterState) rowsBeforeTotal.push({ label: "IGST", value: 0 });
        else {
            rowsBeforeTotal.push({ label: "CGST", value: 0 });
            rowsBeforeTotal.push({ label: "SGST", value: 0 });
        }
    }
    gst.rateGroups.forEach(([rate, taxAmount]) => {
        if (gst.isInterState) {
            rowsBeforeTotal.push({ label: `IGST @${formatRate(rate)}%`, value: taxAmount });
        } else {
            const cgst = roundMoney(taxAmount / 2);
            rowsBeforeTotal.push({ label: `CGST @${formatRate(rate / 2)}%`, value: cgst });
            rowsBeforeTotal.push({ label: `SGST @${formatRate(rate / 2)}%`, value: roundMoney(taxAmount - cgst) });
        }
    });
    if (shipping > 0) rowsBeforeTotal.push({ label: "Delivery Charges", value: shipping });
    if (adjustment !== 0) rowsBeforeTotal.push({ label: "Adjustment", value: adjustment });
    const rowsAfterTotal = [
        { label: "Received", value: paid },
        { label: "Balance", value: balance, bold: true },
    ];

    const words = numberToWordsIndian(total);
    const wordsHeight = textHeight(doc, words, leftWidth, { font: fonts.regular, size: 10, lineGap: 2 });
    const leftBlockHeight = 22 + wordsHeight + 24 + 22 + 16;
    const rightBlockHeight = rowsBeforeTotal.length * rowHeight + bandHeight + 8 + rowsAfterTotal.length * rowHeight + 8;
    const blockHeight = Math.max(leftBlockHeight, rightBlockHeight);

    flow.ensureSpace(blockHeight);
    const startY = flow.y;

    text(doc, "Invoice Amount In Words", leftX, startY, { font: fonts.bold, size: 11 });
    text(doc, words, leftX, startY + 20, { font: fonts.regular, size: 10, width: leftWidth, lineGap: 2 });
    const termsY = startY + 20 + wordsHeight + 20;
    text(doc, "Terms and Conditions", leftX, termsY, { font: fonts.bold, size: 11 });
    text(doc, "Thanks for doing business with us!", leftX, termsY + 20, { font: fonts.regular, size: 10, width: leftWidth });

    let y = startY;
    rowsBeforeTotal.forEach((row) => {
        text(doc, row.label, labelX, y, { font: fonts.regular, size: 10 });
        drawMoney(doc, row.value, valueX, y, valueWidth, { font: fonts.regular, size: 10, negative: Boolean(row.negative) });
        y += rowHeight;
    });

    doc.rect(labelX - 6, y, PAGE.right - labelX + 6, bandHeight).fill(GOLD);
    text(doc, "Total", labelX, y + 6, { font: fonts.bold, size: 10, color: "#ffffff" });
    drawMoney(doc, total, valueX, y + 6, valueWidth, { font: fonts.bold, size: 10, color: "#ffffff" });
    y += bandHeight + 8;

    rowsAfterTotal.forEach((row) => {
        const font = row.bold ? fonts.bold : fonts.regular;
        text(doc, row.label, labelX, y, { font, size: 10 });
        drawMoney(doc, row.value, valueX, y, valueWidth, { font, size: 10 });
        y += rowHeight;
    });
    doc.moveTo(labelX - 6, y + 2).lineTo(PAGE.right, y + 2).lineWidth(0.7).strokeColor(GRAY).stroke();

    flow.y = startY + blockHeight + 12;
}

function drawSignatureBlock(doc, fonts, flow) {
    const blockHeight = 110;
    flow.ensureSpace(blockHeight);
    const rightX = 360;
    text(doc, `For : ${COMPANY.name}`, rightX, flow.y, { font: fonts.regular, size: 10, width: PAGE.right - rightX, align: "right" });
    drawSignature(doc, fonts, PAGE.right - 126, flow.y + 20);
    flow.y += blockHeight;
}

function drawPageNumbers(doc, fonts) {
    const range = doc.bufferedPageRange();
    if (range.count <= 1) return;
    for (let index = range.start; index < range.start + range.count; index += 1) {
        doc.switchToPage(index);
        rightText(doc, `Page ${index + 1} of ${range.count}`, PAGE.left, 812, PAGE.innerWidth, { font: fonts.regular, size: 7, color: GRAY });
    }
}

function renderInvoicePdf(invoice, outputPath = createLocalInvoicePath(invoice.invoiceNumber)) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Loaded here (not at module top) so Turbopack's ESM interop wrapper is handled at call time
    const _pdfkit = require("pdfkit");
    const PDFDocument = _pdfkit.default || _pdfkit;

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 0, compress: true, bufferPages: true });
        const stream = fs.createWriteStream(outputPath);
        const fonts = registerFonts(doc);

        stream.on("finish", () => resolve(outputPath));
        stream.on("error", reject);
        doc.on("error", reject);
        doc.pipe(stream);

        doc.font(fonts.regular);

        const headerBottom = drawFirstPageHeader(doc, fonts);
        const partiesBottom = drawParties(doc, fonts, invoice, headerBottom);

        const gst = computeGstDetails(invoice);
        const flow = createFlow(doc, fonts, invoice, partiesBottom + 6);
        drawItemsTable(doc, fonts, invoice, gst, flow);
        drawSummary(doc, fonts, invoice, gst, flow);
        drawSignatureBlock(doc, fonts, flow);
        drawPageNumbers(doc, fonts);

        doc.end();
    });
}

module.exports = {
    createLocalInvoicePath,
    formatMoney,
    numberToWordsIndian,
    renderInvoicePdf,
};
