const { Client, LocalAuth } = require("whatsapp-web.js");

const qrcode = require("qrcode-terminal");

const pool = require("./db");

const {
    updateConversationSheet
} = require("./googleSheets");
const {
    getContactAd,
    detectAd,
    assignAdToContact
} = require("./adManager");

const clients = {};
const qrCodes = {};
const sessionStatus = {};

const fs = require("fs");

function getChromeExecutablePath() {
    // 1. Honour explicit env var first
    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    // 2. Windows paths
    if (process.platform === "win32") {
        const winPaths = [
            process.env.LOCALAPPDATA  + "\\Google\\Chrome\\Application\\chrome.exe",
            process.env.PROGRAMFILES  + "\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            process.env.LOCALAPPDATA  + "\\Chromium\\Application\\chrome.exe",
            process.env.PROGRAMFILES  + "\\Chromium\\Application\\chrome.exe",
            "C:\\Program Files\\Chromium\\Application\\chrome.exe",
            process.env.LOCALAPPDATA  + "\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
            process.env.PROGRAMFILES  + "\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
            "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
            process.env.PROGRAMFILES  + "\\Microsoft\\Edge\\Application\\msedge.exe",
            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        ].filter(Boolean);
        for (const p of winPaths) {
            if (fs.existsSync(p)) {
                console.log("[Chrome] Found on Windows:", p);
                return p;
            }
        }
    }

    // 3. macOS paths
    if (process.platform === "darwin") {
        const macPaths = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
            "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
        ];
        for (const p of macPaths) {
            if (fs.existsSync(p)) {
                console.log("[Chrome] Found on macOS:", p);
                return p;
            }
        }
    }

    // 4. Linux paths
    if (process.platform === "linux") {
        const linuxPaths = [
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable"
        ];
        for (const p of linuxPaths) {
            if (fs.existsSync(p)) {
                console.log("[Chrome] Found on Linux:", p);
                return p;
            }
        }
    }

    console.warn("[Chrome] WARNING: No Chrome/Chromium found. Set PUPPETEER_EXECUTABLE_PATH in .env");
    return undefined;
}

function getSerializedId(id) {
    return id?._serialized || id?.["$1"] || null;
}

async function createSession(userId, sessionId, wss) {
     // Prevent duplicate sessions
    if (clients[sessionId]) {

        console.log(
            sessionId,
            "ALREADY RUNNING"
        );

        return {
            status: "already_running"
        };
    }

    const { Client, LocalAuth, LocalWebCache } = require("whatsapp-web.js");

    const isLinux   = process.platform === "linux";
    const isWindows = process.platform === "win32";

    /*
     * Puppeteer launch args — platform-aware:
     *  - Linux (Docker):   needs --no-sandbox, --single-process, --no-zygote
     *  - macOS:            skip sandbox flags (not needed, can slow startup)
     *  - Windows:          skip --no-sandbox & --disable-setuid-sandbox
     *                      (they crash Chrome on Windows)
     */
    const commonArgs = [
        "--no-first-run",
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--hide-scrollbars",
        "--mute-audio",
        "--safebrowsing-disable-auto-update",
        "--disable-features=TranslateUI,BlinkGenPropertyTrees"
    ];

    const puppeteerArgs = [
        ...(isLinux   ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-zygote", "--single-process"] : []),
        ...(isWindows ? [] : []),                         // Windows: no extra sandbox flags needed
        ...(!isWindows ? ["--disable-gpu"] : []),         // --disable-gpu can crash on Windows with some setups
        ...commonArgs
    ];

    const cachePath   = process.env.WWEBJS_CACHE_PATH  || "./.wwebjs_cache";
    const authPath    = process.env.WWEBJS_AUTH_PATH   || "./.wwebjs_auth";

    // Ensure cache dirs exist
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
    if (!fs.existsSync(authPath))  fs.mkdirSync(authPath,  { recursive: true });

    /*
     * Clean up stale Chrome lock files left by crashes / hard kills.
     * Without this, Puppeteer throws "browser is already running" even
     * though no browser is actually open.
     */
    const lockFiles = [
        `${authPath}/session-${sessionId}/SingletonLock`,
        `${authPath}/session-${sessionId}/SingletonSocket`,
        `${authPath}/session-${sessionId}/SingletonCookie`,
        `${cachePath}/SingletonLock`,
        `${cachePath}/SingletonSocket`
    ];
    for (const lf of lockFiles) {
        try {
            if (fs.existsSync(lf)) {
                fs.unlinkSync(lf);
                console.log("[Chrome] Removed stale lock file:", lf);
            }
        } catch (_) {}
    }

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: sessionId,
            dataPath: authPath
        }),

        /*
         * Use remote web version cache — avoids the stale local HTML that
         * causes "Execution context was destroyed" crashes at startup.
         */
        webVersionCache: {
            type: "remote",
            remotePath: "https://raw.githubusercontent.com/wwebjs/wwebjs-version-files/main"
        },

        puppeteer: {
            headless: true,
            protocolTimeout: 600000,
            executablePath: getChromeExecutablePath(),
            args: puppeteerArgs
        }
    });

    clients[sessionId] = client;

    client.on("qr", qr => {

    console.log(
        "QR GENERATED"
    );

    qrCodes[sessionId] = qr;

    sessionStatus[sessionId] =
        "qr_pending";

        wss.clients.forEach(client => {

    if (client.readyState === 1) {

        client.send(
            JSON.stringify({
                sessionId,
                status: "qr_pending",
                qr
            })
        );
    }
});

    qrcode.generate(qr, {
        small: true
    });
});

client.on("authenticated", () => {

    console.log(
        sessionId,
        "AUTHENTICATED"
    );

    sessionStatus[sessionId] =
        "connected";
});

client.on("auth_failure", msg => {

    console.log(
        sessionId,
        "AUTH FAILED:",
        msg
    );

    sessionStatus[sessionId] =
        "auth_failed";
});

client.on("disconnected", async reason => {
    console.log(
        sessionId,
        "DISCONNECTED:",
        reason
    );
    sessionStatus[sessionId] = "disconnected";
    try {
        await pool.execute(
            `
            UPDATE whatsapp_accounts
            SET last_recovery_at = NOW()
            WHERE session_id = ?
            `,
            [sessionId]
        );
        console.log(
            "DISCONNECT TIME SAVED"
        );
    } catch (error) {
        console.log(
            "ERROR SAVING DISCONNECT TIME:",
            error.message
        );
    }
    delete clients[sessionId];
    delete qrCodes[sessionId];
});


    client.on("ready", async () => {

        try {

            console.log(sessionId, "CONNECTED");
            const [recoveryRows] = await pool.execute(
                `
                SELECT last_recovery_at
                FROM whatsapp_accounts
                WHERE session_id = ?
                LIMIT 1
                `,
                [sessionId]
            );
            const lastRecovery = recoveryRows.length
            ? recoveryRows[0].last_recovery_at
            : null;
            sessionStatus[sessionId] = "connected";
            wss.clients.forEach(client => {

    if (client.readyState === 1) {

        client.send(
            JSON.stringify({
                sessionId,
                status: "connected"
            })
        );
    }
});
            const number =
                client.info.wid.user;

            const [rows] =
    await pool.execute(
        `
        SELECT id
        FROM whatsapp_accounts
        WHERE session_id = ?
        LIMIT 1
        `,
        [sessionId]
    );

if (!rows.length) {

    await pool.execute(
        `
        INSERT INTO whatsapp_accounts
        (
            user_id,
            session_id,
            phone_number,
            connected_at
        )
        VALUES
        (
            ?, ?, ?, NOW()
        )
        `,
        [
            userId,
            sessionId,
            number
        ]
    );

    console.log(
        "WHATSAPP ACCOUNT SAVED"
    );

} else {

    console.log(
        "WHATSAPP ACCOUNT ALREADY EXISTS"
    );
}
            if (process.env.ENABLE_RECOVERY === "true") {
                setTimeout(async () => {
                    console.log("Starting recovery after 30 seconds...");
                    await recoverOldMessages(client, sessionId, lastRecovery);
                }, 30000);
            }
        } catch (error) {

            console.error(
                "ACCOUNT SAVE ERROR:",
                error
            );
        }
    });

    client.on("message_create", async (msg) => {

    try {

        // Save only text messages
        if (msg.type !== "chat") {
            return;
        }
        if (!msg.body || !msg.body.trim()) {
          return;
        }

        // Ignore WhatsApp Status updates
if (
    msg.from === "status@broadcast" ||
    msg.to === "status@broadcast"
) {
    return;
}

// LID-identified message — proceed, don't skip
if (
    (msg.from && msg.from.endsWith("@lid")) ||
    (msg.to && msg.to.endsWith("@lid"))
) {
    console.log("LID message received — saving anyway");
    console.log("FROM:", msg.from);
    console.log("TO:", msg.to);
}
// Get chat details - don't hard-fail if getChat() is broken upstream
const rawFrom = msg.from || "";
const rawTo = msg.to || "";

const isGroup =
    rawFrom.endsWith("@g.us") ||
    rawTo.endsWith("@g.us");

let chat = null;
let groupName = "";

try {

    chat = await msg.getChat();

    if (isGroup && chat?.name) {
        groupName = chat.name;
    }

} catch (err) {

    console.log("getChat() failed, continuing with JID-derived info");
    console.log("FROM:", msg.from);
    console.log("TO:", msg.to);
    console.log("ERROR:", err.message);
}

        const direction =
            msg.fromMe
                ? "sent"
                : "received";

        /*
         * Get account id
         */
        const [accountRows] =
            await pool.execute(
                `
                SELECT id
                FROM whatsapp_accounts
                WHERE session_id = ?
                LIMIT 1
                `,
                [sessionId]
            );

        if (!accountRows.length) {
            return;
        }

        const accountId =
            accountRows[0].id;

        /*
         * Get contact details - don't hard-fail if getContact() is broken upstream
         */
        let contact = null;

        try {

            contact =
                msg.fromMe
                    ? await chat?.getContact()
                    : await msg.getContact();

        } catch (err) {

            console.log("getContact() failed, continuing with JID-derived info");
            console.log("ERROR:", err.message);
        }

        const whatsappId =
    (msg.fromMe ? msg.to : msg.from).trim();

        const name =
            contact?.pushname ||
            contact?.name ||
            msg._data?.notifyName ||
            null;

        let phone = null;

        if (
            contact?.id &&
            contact.id.server === "c.us"
        ) {

            phone =
                contact.id.user;
        }

        if (
            !phone &&
            contact?.number
        ) {

            phone =
                contact.number;
        }

        if (
            !phone &&
            !whatsappId.endsWith("@lid")
        ) {

            phone =
                whatsappId
                .replace("@c.us", "")
                .replace("@g.us", "");
        }

        /*
         * Find existing contact
         */
        const uniqueKey =
        whatsappId
        .replace("@c.us", "")
        .replace("@g.us", "")
        .replace("@lid", "");

        const serializedMsgId = getSerializedId(msg.id);

        const [contactRows] =
            await pool.execute(
                `
                SELECT id
                FROM contacts
                WHERE unique_key = ?
                AND account_id = ?
                LIMIT 1
                `,
                [
                    uniqueKey,
                    accountId
                ]
            );

        let contactId;
        let adId = null;
        let adName = "";

        if (contactRows.length) {

            contactId =
                contactRows[0].id;
            await pool.execute(
                `
                UPDATE contacts
                SET
                name = COALESCE(?, name),
                phone = COALESCE(?, phone),
                whatsapp_id = ?
                WHERE id = ?
                `,
                [
                    name,
                    phone,
                    whatsappId,
                    contactId
                ]
            );
        } else {

            const [contactInsert] =
    await pool.execute(
    `
    INSERT INTO contacts
    (
        account_id,
        whatsapp_id,
        phone,
        name,
        unique_key
    )
    VALUES
    (
        ?, ?, ?, ?, ?
    )
    ON DUPLICATE KEY UPDATE
        whatsapp_id = VALUES(whatsapp_id),
        phone = VALUES(phone),
        name = COALESCE(VALUES(name), name),
        unique_key = VALUES(unique_key)
    `,
    [
        accountId,
        whatsappId,
        phone,
        name,
        uniqueKey
    ]
);
                const [finalContact] =
    await pool.execute(
        `
        SELECT id
        FROM contacts
        WHERE unique_key = ?
        AND account_id = ?
        LIMIT 1
        `,
        [
            uniqueKey,
            accountId
        ]
    );

if (!finalContact.length) {
    console.log("CONTACT CREATION FAILED");
    return;
}

contactId = finalContact[0].id;

            console.log(
                "NEW CONTACT SAVED"
            );
        }
        /*
 * Get current Ad assigned to this contact
 */
const contactAd = await getContactAd(contactId);

adId = contactAd.adId;
adName = contactAd.adName;
        /*
 * Detect Ad from first received message
 */
if (
    !adId &&
    direction === "received" &&
    msg.body
) {

    const matchedAd = await detectAd(msg.body);

if (matchedAd) {

    adId = matchedAd.id;
    adName = matchedAd.ad_name;

    await assignAdToContact(
        contactId,
        adId
    );

    console.log(
        `AD DETECTED: ${adName}`
    );
}
}
        /*
        * Check duplicate message
        */
        const [existingMessage] =
        await pool.execute(
            `
            SELECT id
            FROM messages
            WHERE whatsapp_message_id = ?
            LIMIT 1
            `,
            [serializedMsgId]
        );
        if (existingMessage.length) {
            console.log(
                "MESSAGE ALREADY EXISTS"
            );
            return;
        }

        /*
         * Save message
         */
        await pool.execute(
            `
            INSERT INTO messages
            (
            contact_id,
            account_id,
            whatsapp_message_id,
            message,
            direction,
            is_group,
            group_name,
            created_at
            )
            VALUES
            (
            ?, ?, ?, ?, ?, ?, ?, ?
            )
            `,
            [
                contactId,
                accountId,
                serializedMsgId,
                msg.body,
                direction,
                isGroup,
                groupName,
                new Date(
                    msg.timestamp * 1000
                )
            ]
        );

        console.log(
            "MESSAGE SAVED"
        );

        console.log({
            whatsappId,
            phone,
            name,
            message: msg.body,
            direction
        });

        /*
 * Save / Update conversation in Google Sheets
 */
try {

    const [userRows] = await pool.execute(
    `
    SELECT
    u.category,
    u.subcategory,
    u.centre
FROM users u
JOIN whatsapp_accounts wa
ON wa.user_id = u.id
WHERE wa.session_id = ?
LIMIT 1;
    `,
    [sessionId]
);

const category =
    userRows.length
        ? userRows[0].category
        : "others";
const subCategory =
    userRows.length
        ? userRows[0].subcategory
        : "";

const centre =
    userRows.length
        ? userRows[0].centre
        : "";

if (!phone && contactId) {
    const [dbContact] = await pool.execute(
        `SELECT phone FROM contacts WHERE id = ? LIMIT 1`,
        [contactId]
    );
    if (dbContact.length && dbContact[0].phone) {
        phone = dbContact[0].phone;
    }
}

await updateConversationSheet(
    category,
    subCategory,
    centre,
    phone,
    adName,
    msg.body,
    direction
);

    console.log(
        "CONVERSATION UPDATED IN GOOGLE SHEETS"
    );

} catch (sheetError) {

    console.error(
        "GOOGLE SHEETS ERROR:",
        sheetError.message
    );

}

    } catch (error) {

        console.error(
            "MESSAGE ERROR:",
            error
        );
    }
});

client.on("loading_screen", (percent, message) => {
    console.log(
        "LOADING:",
        percent,
        message
    );
});

client.on("change_state", state => {
    console.log(
        "STATE:",
        state
    );
});

client.on("error", error => {
    console.error(
        "CLIENT ERROR:",
        error
    );
});

    client.initialize().catch(err => {
        console.error("CLIENT INITIALIZATION ERROR:", err);
        sessionStatus[sessionId] = "error";
        delete clients[sessionId];
        if (wss && wss.clients) {
            wss.clients.forEach(c => {
                if (c.readyState === 1) {
                    c.send(JSON.stringify({
                        sessionId,
                        status: "error",
                        error: err.message
                    }));
                }
            });
        }
    });
}
async function recoverOldMessages(
client,
sessionId,
lastRecovery,
) {
try {

    console.log(
        "STARTING MESSAGE RECOVERY"
    );

    const [rows] =
        await pool.execute(
            `
            SELECT
                id,
                last_recovery_at
            FROM whatsapp_accounts
            WHERE session_id = ?
            LIMIT 1
            `,
            [sessionId]
        );

    if (!rows.length) {
        return;
    }

    const accountId =
        rows[0].id;

    const lastSync =
        rows[0].last_recovery_at;

    let chats;
    console.log(
    "Checking state before getChats..."
);

console.log(
    await client.getState()
);

try {

    chats = await client.getChats();

    console.log(
        "TOTAL CHATS:",
        chats.length
    );

} catch (err) {

    console.log(
        "getChats failed"
    );

    console.log(err);

console.log(
    "Error name:",
    err.name
);

console.log(
    "Error message:",
    err.message
);

console.log(
    "Stack:"
);

console.log(
    err.stack
);

try {

    const debug = await client.pupPage.evaluate(() => {
    return {
        hasStore: typeof window.Store !== "undefined",
        hasWWebJS: typeof window.WWebJS !== "undefined",
        hasWebpackChunk:
            typeof window.webpackChunkbuild !== "undefined" ||
            typeof window.webpackChunkwhatsapp_web_client !== "undefined",

        keys: Object.keys(window).filter(k =>
            k.toLowerCase().includes("store") ||
            k.toLowerCase().includes("webpack")
        )
    };
});

console.log(debug);

} catch (e) {

    console.log(
        "PAGE DEBUG FAILED"
    );

    console.log(e);
}

return;
}

chats = chats.filter(chat => chat.lastMessage);

    for (const chat of chats) {
        const lastChatTime =
        new Date(
            chat.lastMessage.timestamp * 1000
        );
        if (
            lastRecovery &&
            lastChatTime <= new Date(lastRecovery)
        ) {
            continue;
        }
        if (
    chat.id._serialized === "status@broadcast"
) {
    continue;
}
        let contact;

try {

    contact = await chat.getContact();

} catch (err) {

    console.log(
        "Unable to get contact:",
        chat.id._serialized
    );

    continue;

}
        if (contact.isMe) {
          continue;
        }

        let messages;

try {

    messages = await chat.fetchMessages({
        limit: 1000
    });

} catch (err) {

    console.log(
        "fetchMessages failed:",
        chat.id._serialized
    );

    console.log(err);

    continue;
}

        for (const msg of messages) {

            try {

                if (
                    msg.type !== "chat"
                ) {
                    continue;
                }
                if (!msg.body || !msg.body.trim()) {
                  continue;
                }

                const messageTime =
                    new Date(
                        msg.timestamp * 1000
                    );
                if (
                    lastSync && messageTime.getTime() <=
                    new Date(lastSync).getTime()
                ) {
                    continue;
                }

                const direction =
                    msg.fromMe
                        ? "sent"
                        : "received";

                const whatsappId =
    String(msg.fromMe ? msg.to : msg.from).trim();

                const name =
                    contact.pushname ||
                    contact.name ||
                    null;

                const phone =
                    contact.id?.user ||
                    null;

                let contactId;
                let adName = "";

                const uniqueKey =
                phone ||
                whatsappId
                .replace("@c.us", "")
                .replace("@g.us", "")
                .replace("@lid", "");

                const [contactRows] =
                    await pool.execute(
                        `
                        SELECT
                        c.id,
                        c.ad_id,
                        a.ad_name
                        FROM contacts c
                        LEFT JOIN ads a
                        ON a.id = c.ad_id
                        WHERE c.unique_key = ?
                        AND c.account_id = ?
                        LIMIT 1
                        `,
                        [
                            uniqueKey,
                            accountId
                        ]
                    );

                if (
                    contactRows.length
                ) {

                    contactId =
                        contactRows[0].id;
                    adName =
                    contactRows[0].ad_name || "";
                    await pool.execute(
                        `
                        UPDATE contacts
                        SET
                        name = COALESCE(?, name),
                        phone = COALESCE(?, phone),
                        whatsapp_id = ?
                        WHERE id = ?
                        `,
                        [
                            name,
                            phone,
                            whatsappId,
                            contactId
                        ]
                    );

                    const contactAd =
                        await getContactAd(contactId);

                    adName =
                        contactAd.adName;
                } else {

                    const [insert] =
                        await pool.execute(
    `
    INSERT INTO contacts
    (
        account_id,
        whatsapp_id,
        phone,
        name,
        unique_key
    )
    VALUES
    (
        ?, ?, ?, ?, ?
    )
    ON DUPLICATE KEY UPDATE
        whatsapp_id = VALUES(whatsapp_id),
        phone = VALUES(phone),
        name = COALESCE(VALUES(name), name),
        unique_key = VALUES(unique_key)
    `,
    [
        accountId,
        whatsappId,
        phone,
        name,
        uniqueKey
    ]
);

const [savedContact] = await pool.execute(
    `
    SELECT id
    FROM contacts
    WHERE account_id = ?
    AND unique_key = ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [accountId, uniqueKey]
);
    if (!savedContact.length) {
    console.log(
        "CONTACT NOT FOUND AFTER INSERT"
    );
    continue;
}


contactId =
    savedContact[0].id;

const contactAd =
    await getContactAd(contactId);

adName =
    contactAd.adName;

 /*
 * Detect Ad from first recovered received message
 */
if (
    !adName &&
    direction === "received" &&
    msg.body
) {

    const matchedAd =
await detectAd(msg.body);

if (matchedAd) {

    adName =
        matchedAd.ad_name;

    await assignAdToContact(
        contactId,
        matchedAd.id
    );

    console.log(
        `RECOVERY AD DETECTED: ${adName}`
    );
}
}
                }

                // Duplicate check
                const [duplicate] =
                await pool.execute(
                    `
                    SELECT id
                    FROM messages
                    WHERE whatsapp_message_id = ?
                    LIMIT 1
                    `,
                    [
                        msg.id._serialized
                    ]
                );
                if (duplicate.length) {
                    continue;
                }

                await pool.execute(
                    `
                    INSERT INTO messages
                    (
                    contact_id,
                    account_id,
                    whatsapp_message_id,
                    message,
                    direction,
                    is_group,
                    group_name,
                    created_at
                    )
                    VALUES
                    (
                    ?, ?, ?, ?, ?, ?, ?, ?
                    )
                    `,
                    [
                        contactId,
                        accountId,
                        msg.id._serialized,
                        msg.body,
                        direction,
                        chat.isGroup,
                        chat.isGroup
                        ? chat.name
                        : "",
                        messageTime
                    ]
                );
                /*
 * Save recovered message to Google Sheets
 */
try {

    const [userRows] = await pool.execute(
    `
    SELECT
    u.category,
    u.subcategory,
    u.centre
FROM users u
JOIN whatsapp_accounts wa
ON wa.user_id = u.id
WHERE wa.session_id = ?
LIMIT 1;
    `,
    [sessionId]
);

const category =
    userRows.length
        ? userRows[0].category
        : "others";

const subCategory =
    userRows.length
        ? userRows[0].subcategory
        : "";

const centre =
    userRows.length
        ? userRows[0].centre
        : "";

if (!phone && contactId) {
    const [dbContact] = await pool.execute(
        `SELECT phone FROM contacts WHERE id = ? LIMIT 1`,
        [contactId]
    );
    if (dbContact.length && dbContact[0].phone) {
        phone = dbContact[0].phone;
    }
}

await updateConversationSheet(
    category,
    subCategory,
    centre,
    phone,
    adName,
    msg.body,
    direction
);

    console.log(
        "RECOVERY CONVERSATION UPDATED"
    );

} catch (error) {

    console.log(
        "RECOVERY SHEET ERROR:",
        error.message
    );

}
            } catch (error) {

                console.log(
                    "RECOVERY ERROR:",
                    error.message
                );
            }
        }
    }
    await pool.execute(
        `
        UPDATE whatsapp_accounts
        SET last_recovery_at = NOW()
        WHERE session_id = ?
        `,
        [sessionId]
    );
    

    console.log(
        "MESSAGE RECOVERY FINISHED"
    );

} catch (error) {

    console.log(
        "RECOVERY FAILED"
    );

    console.log(error);

    console.log(error.stack);
}
}

module.exports = {
    createSession,
    clients,
    qrCodes,
    sessionStatus
};