const pool = require("./db");

async function getContactAd(contactId) {

    const [rows] = await pool.execute(
        `
        SELECT
    c.ad_id,
    a.ad_name
FROM contacts c
LEFT JOIN ads a
    ON a.id = c.ad_id
WHERE c.id = ?
LIMIT 1
        `,
        [contactId]
    );

    if (!rows.length) {
        return {
            adId: null,
            adName: ""
        };
    }

    return {
        adId: rows[0].ad_id,
        adName: rows[0].ad_name || ""
    };
}

async function detectAd(message) {
    if (!message || typeof message !== "string") {
        return null;
    }

    const [rows] = await pool.execute(
        `
        SELECT
            id,
            ad_name,
            keyword
        FROM ads
        WHERE (status IS NULL OR status = 'active')
          AND keyword IS NOT NULL
          AND TRIM(keyword) != ''
          AND LOWER(?) LIKE CONCAT('%', LOWER(TRIM(keyword)), '%')
        ORDER BY CHAR_LENGTH(keyword) DESC
        LIMIT 1
        `,
        [message]
    );

    return rows.length
        ? rows[0]
        : null;
}

async function assignAdToContact(
    contactId,
    adId
) {

    await pool.execute(
        `
        UPDATE contacts
        SET ad_id = ?
        WHERE id = ?
        `,
        [
            adId,
            contactId
        ]
    );
}

module.exports = {
    getContactAd,
    detectAd,
    assignAdToContact
};