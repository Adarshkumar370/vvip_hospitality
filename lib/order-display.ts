type OrderLike = {
    id?: string | number | null;
    order_number?: string | null;
};

export function formatOrderDisplayNumber(order: OrderLike) {
    if (order.order_number) {
        const match = String(order.order_number).match(/(\d+)$/);
        if (match) return String(Number(match[1]));
        return String(order.order_number);
    }

    return formatNumericFallbackId(order.id);
}

export function formatOrderDisplayLabel(order: OrderLike) {
    const number = formatOrderDisplayNumber(order);
    return number ? `#${number}` : "";
}

function formatNumericFallbackId(id: OrderLike["id"]) {
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
