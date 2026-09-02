const express = require("express");
const router = express.Router();

const {
    createSession,
    clients,
    qrCodes,
    sessionStatus
} = require("../whatsappManager");

/*
 * Create new session
 */
router.get("/connect/:userId", async (req, res) => {

    const userId =
        req.params.userId;

    const sessionId =
        "session_" + userId;

    // Prevent duplicate clients
    if (
    clients[sessionId] &&
    sessionStatus[sessionId] !== "disconnected"
) {
    let status =
        sessionStatus[sessionId];

    // Show connected instead of authenticated
    if (status === "authenticated") {

        status = "connected";
    }

    return res.json({
        message: "Session already running",
        sessionId,
        status: sessionStatus[sessionId]
    });
}

    createSession(
        userId,
        sessionId,
        req.wss
    );

    res.json({
        message:
            "Session Created",
        sessionId
    });
});

/*
 * Get QR code
 */
router.get("/qr/:sessionId",
    (req, res) => {

        const sessionId =
            req.params.sessionId;

        const qr =
            qrCodes[sessionId];

        if (!qr) {

            return res.json({
                status: "QR Not Available"
            });
        }

        res.json({
            sessionId,
            qr
        });
    }
);

/*
 * Get session status
 */
router.get(
    "/status/:sessionId",
    (req, res) => {

        const sessionId =
            req.params.sessionId;

        res.json({
            sessionId,
            status:
                sessionStatus[
                    sessionId
                ] || "not_found"
        });
    }
);

router.get(
    "/reconnect/:userId",
    (req, res) => {

        const userId =
            req.params.userId;

        const sessionId =
            "session_" + userId;

        delete clients[sessionId];
        delete qrCodes[sessionId];
        delete sessionStatus[sessionId];

        createSession(
            userId,
            sessionId,
            req.wss
        );

        res.json({
            message:
                "Reconnect started",
            sessionId
        });
    }
);

router.get(
    "/contacts/:userId",
    async (req, res) => {

        try {

            const userId =
                req.params.userId;

            const [rows] =
                await require("../db")
                .execute(
                    `
                    SELECT
                        c.id,
                        c.name,
                        c.phone,
                        c.whatsapp_id
                    FROM contacts c
                    INNER JOIN whatsapp_accounts wa
                    ON c.account_id = wa.id
                    WHERE wa.user_id = ?
                    ORDER BY c.name
                    `,
                    [userId]
                );

            res.json(rows);

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message:
                    "Error fetching contacts"
            });
        }
    }
);

router.get(
    "/stats/:userId",
    async (req, res) => {

        try {

            const userId =
                req.params.userId;

            const db =
                require("../db");

            /*
             * Total Contacts
             */
            const [contactRows] =
                await db.execute(
                    `
                    SELECT COUNT(*) AS totalContacts
                    FROM contacts c
                    INNER JOIN whatsapp_accounts wa
                    ON c.account_id = wa.id
                    WHERE wa.user_id = ?
                    `,
                    [userId]
                );

            /*
             * Total Messages
             */
            const [messageRows] =
                await db.execute(
                    `
                    SELECT COUNT(*) AS totalMessages
                    FROM messages m
                    INNER JOIN whatsapp_accounts wa
                    ON m.account_id = wa.id
                    WHERE wa.user_id = ?
                    `,
                    [userId]
                );

            res.json({

                totalContacts:
                    contactRows[0]
                    .totalContacts,

                totalMessages:
                    messageRows[0]
                    .totalMessages
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({

                message:
                    "Error fetching stats"

            });
        }
    }
);

module.exports = router;