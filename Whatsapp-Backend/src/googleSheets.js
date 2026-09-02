const { google } = require("googleapis");

let auth;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
        const credentials = typeof process.env.GOOGLE_CREDENTIALS_JSON === "string" 
            ? JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON) 
            : process.env.GOOGLE_CREDENTIALS_JSON;
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
                "https://www.googleapis.com/auth/spreadsheets"
            ]
        });
    } catch (err) {
        console.error("Failed to parse GOOGLE_CREDENTIALS_JSON environment variable:", err.message);
    }
}

if (!auth) {
    auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || "credentials.json",
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets"
        ]
    });
}
const SPREADSHEETS = {
    hair: "1RUZMAygwKrmNw903-Wy3OWtvOu9KQpR-k4klNKTVxvA",
    skin: "1obAzYiOPTeMYJly3PC6iugdkpnU13cREBrXS3k-HBxk",
    pmu: "1zwEVINHui0KIHOlak0cd5Lf1SmLYpNofBwploWHsZaQ",
    weight_loss: "1ZgcJiNYJNQ80xoL-Y2W0rTPWFUho2mprIKmuSfB4igk",
};

const SHEET_NAME = "Leads";

async function getSheetsClient() {
    const client = await auth.getClient();
    return google.sheets({ version: "v4", auth: client });
}

async function updateConversationSheet(
    category, subCategory, centre, phone, adName, message, direction
) {
    const sheets = await getSheetsClient();

    const normalizedCategory =
        (category || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
    console.log("category received:", JSON.stringify(category), "→ normalized:", normalizedCategory);

    const spreadsheetId = SPREADSHEETS[normalizedCategory];

    if (!spreadsheetId) {
        console.error(
            `UNKNOWN CATEGORY "${category}" (normalized: "${normalizedCategory}") — no matching spreadsheet. Skipping.`
        );
        return;
    }

    const response =
        await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_NAME}!A:H`
        });

    const rows =
        response.data.values || [];

    const cleanPhone = (phone || "").replace(/\D/g, "");

    let rowIndex = -1;

    /*
     * Match by Phone Number (Column G, index 6)
     */
    if (cleanPhone) {
        for (let i = 1; i < rows.length; i++) {
            const rowPhone = (rows[i][6] || "").replace(/\D/g, "");
            if (rowPhone && (rowPhone === cleanPhone || rowPhone.endsWith(cleanPhone) || cleanPhone.endsWith(rowPhone))) {
                rowIndex = i;
                break;
            }
        }
    }

    const formattedMessage =
        direction === "received"
            ? `➡️ ${message}`
            : `⬅️ ${message}`;

    /*
     * New customer
     */
    if (rowIndex === -1) {

        const serialNo = rows.length;
        const nextRow = rows.length + 1;

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAME}!A${nextRow}:H${nextRow}`,
            valueInputOption: "RAW",
            requestBody: {
                values: [[
                    serialNo,
                    category,
                    subCategory,
                    adName || "",
                    centre || "",
                    new Date().toLocaleString(),
                    phone || "",
                    formattedMessage
                ]]
            }
        });

        console.log(
            "NEW CONVERSATION CREATED at row " + nextRow
        );

        return;
    }

    let conversation =
        rows[rowIndex][7] || "";

    conversation +=
        (conversation ? "\n" : "") +
        formattedMessage;

    const existingAd =
        rows[rowIndex][3] || "";

    const resolvedAd =
        !existingAd && adName ? adName : existingAd;

    const existingCentre =
        rows[rowIndex][4] || "";

    const resolvedCentre =
        !existingCentre && centre ? centre : existingCentre;

    const existingTimestamp =
        rows[rowIndex][5] || new Date().toLocaleString();

    const existingPhone =
        rows[rowIndex][6] || "";

    const resolvedPhone =
        !existingPhone && phone ? phone : existingPhone;

    /*
     * Google Sheets limit
     */
    const MAX_LENGTH =
        50000;

    if (
        conversation.length >
        MAX_LENGTH
    ) {

        conversation =
            conversation.slice(
                conversation.length -
                MAX_LENGTH
            );
    }

    /*
     * Update Columns D to H (Ad Name, Centre, Timestamp, Phone, Conversation)
     */
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range:
            `${SHEET_NAME}!D${rowIndex + 1}:H${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: {
            values: [[
                resolvedAd,
                resolvedCentre,
                existingTimestamp,
                resolvedPhone,
                conversation,
            ]]
        }
    });

    console.log(
        "CONVERSATION UPDATED AT ROW " + (rowIndex + 1)
    );
}

module.exports = {
    getSheetsClient,
    updateConversationSheet
};