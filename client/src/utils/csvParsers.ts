export interface ParsedTransaction {
    date: string;
    merchant: string;
    amount: number;
    type: "credit" | "debit";
    occurrences?: number;
}

const parseNumericString = (raw: string): number => {
    if (!raw || raw.trim() === "") return 0;
    return parseFloat(raw.replace(/₪/g, "").replace(/,/g, "").trim());
};

const formatDate = (raw: string): string => {
    const parts = raw.trim().split("/");
    if (parts.length !== 3) return raw;
    const [day, month, year] = parts;
    return `20${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const parseCSVRow = (line: string): string[] => {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            cols.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    cols.push(current);
    return cols;
};

export const parseMizrahiCSV = (csvText: string): ParsedTransaction[] => {
    const lines = csvText.split("\n");
    const transactions: ParsedTransaction[] = [];

    let dataStartRow = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("תאריך") && lines[i].includes("סוג תנועה")) {
            dataStartRow = i + 1;
            break;
        }
    }

    if (dataStartRow === -1) return transactions;

    for (let i = dataStartRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "" || line === ",,,,,,") break;
        if (line.includes("תנועות היום")) break;

        const cols = parseCSVRow(line);
        if (cols.length < 5) continue;

        const date = cols[0].trim();
        const merchant = cols[2].replace(/"/g, "").trim();
        const credit = parseNumericString(cols[3]);
        const debit = parseNumericString(cols[4]);
        const skipMerchants = [
            "הרשאה כאל",
            "הרשאה ישראכרט",
            "הרשאה דינרס",
            "ויזה כאל",
        ];

        if (!date || !merchant) continue;
        if (skipMerchants.some((skip) => merchant.includes(skip))) continue;
        if (merchant.includes("הרשאה")) continue;

        if (credit > 0) {
            transactions.push({ date: formatDate(date), merchant, amount: credit, type: "credit" });
        } else if (debit > 0) {
            transactions.push({ date: formatDate(date), merchant, amount: -debit, type: "debit" });
        }
    }

    return transactions;
};

export const parseCalCSV = (csvText: string): ParsedTransaction[] => {
    const lines = csvText.split("\n");
    const transactions: ParsedTransaction[] = [];
    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{2}/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!datePattern.test(line)) continue;
        if (line === "" || line === ",,,,,,") break;

        const cols = parseCSVRow(line);
        if (cols.length < 4) continue;

        const date = cols[0].trim();
        const merchant = cols[1].replace(/"/g, "").trim();
        const amount = parseNumericString(cols[3]);

        if (!date || !merchant) continue;
        if (isNaN(amount) || amount <= 0) continue;

        transactions.push({ date: formatDate(date), merchant, amount: -amount, type: "debit" });
    }

    return transactions;
};

export const parseIsracardCSV = (csvText: string): ParsedTransaction[] => {
    const lines = csvText.split("\n");
    console.log("First 15 lines:", lines.slice(0, 15));
    const transactions: ParsedTransaction[] = [];

    // find header row — contains תאריך רכישה
    let dataStartRow = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("תאריך רכישה") && lines[i].includes("שם בית עסק")) {
            dataStartRow = i + 1;
            break;
        }
    }

    if (dataStartRow === -1) return transactions;

    for (let i = dataStartRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "" || line === ",,,,,,,") break;

        const cols = parseCSVRow(line);
        if (cols.length < 5) continue;

        const date = cols[0].trim();
        const merchant = cols[1].replace(/"/g, "").trim();
        const billingAmount = parseNumericString(cols[4]);

        // skip rows with no date (totals row) or zero amount
        if (!date || !merchant) continue;
        if (isNaN(billingAmount) || billingAmount <= 0) continue;

        transactions.push({
            date: formatIsracardDate(date),
            merchant,
            amount: -billingAmount,
            type: "debit",
        });
    }

    return transactions;
};

const formatIsracardDate = (raw: string): string => {
    // converts DD.MM.YY to YYYY-MM-DD
    const parts = raw.trim().split(".");
    if (parts.length !== 3) return raw;
    const [day, month, year] = parts;
    return `20${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

export const enrichWithOccurrences = (
    transactions: ParsedTransaction[]
): ParsedTransaction[] => {
    const merchantCount: Record<string, number> = {};
    transactions.forEach((t) => {
        merchantCount[t.merchant] = (merchantCount[t.merchant] || 0) + 1;
    });

    return transactions.map((t) => ({
        ...t,
        occurrences: merchantCount[t.merchant],
    }));
};