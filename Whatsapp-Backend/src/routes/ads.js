const express = require("express");
const router = express.Router();
const pool = require("../db");

/*
 * GET /ads - List all ads
 */
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT id, ad_name, category, keyword, status, created_at, updated_at
             FROM ads
             ORDER BY id DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error("GET /ads error:", error);
        res.status(500).json({ message: "Error fetching ads", error: error.message });
    }
});

/*
 * GET /ads/:id - Get a single ad by ID
 */
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT id, ad_name, category, keyword, status, created_at, updated_at
             FROM ads
             WHERE id = ?
             LIMIT 1`,
            [req.params.id]
        );
        if (!rows.length) {
            return res.status(404).json({ message: "Ad not found" });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("GET /ads/:id error:", error);
        res.status(500).json({ message: "Error fetching ad", error: error.message });
    }
});

/*
 * POST /ads - Create a new ad record
 */
router.post("/", async (req, res) => {
    try {
        const { ad_name, keyword, category, status } = req.body;

        if (!ad_name || !ad_name.trim()) {
            return res.status(400).json({ message: "ad_name is required" });
        }
        if (!keyword || !keyword.trim()) {
            return res.status(400).json({ message: "keyword is required" });
        }

        const [result] = await pool.execute(
            `INSERT INTO ads (ad_name, keyword, category, status)
             VALUES (?, ?, ?, ?)`,
            [
                ad_name.trim(),
                keyword.trim(),
                category ? category.trim() : "general",
                status ? status.trim() : "active"
            ]
        );

        res.status(201).json({
            message: "Ad created successfully",
            adId: result.insertId
        });
    } catch (error) {
        console.error("POST /ads error:", error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "An ad with this keyword already exists" });
        }
        res.status(500).json({ message: "Error creating ad", error: error.message });
    }
});

/*
 * PUT /ads/:id - Update an existing ad
 */
router.put("/:id", async (req, res) => {
    try {
        const { ad_name, keyword, category, status } = req.body;

        const [existing] = await pool.execute(
            `SELECT id FROM ads WHERE id = ? LIMIT 1`,
            [req.params.id]
        );

        if (!existing.length) {
            return res.status(404).json({ message: "Ad not found" });
        }

        await pool.execute(
            `UPDATE ads
             SET ad_name = COALESCE(?, ad_name),
                 keyword = COALESCE(?, keyword),
                 category = COALESCE(?, category),
                 status = COALESCE(?, status)
             WHERE id = ?`,
            [
                ad_name !== undefined ? ad_name.trim() : null,
                keyword !== undefined ? keyword.trim() : null,
                category !== undefined ? category.trim() : null,
                status !== undefined ? status.trim() : null,
                req.params.id
            ]
        );

        res.json({ message: "Ad updated successfully" });
    } catch (error) {
        console.error("PUT /ads/:id error:", error);
        res.status(500).json({ message: "Error updating ad", error: error.message });
    }
});

/*
 * DELETE /ads/:id - Delete an ad
 */
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await pool.execute(
            `DELETE FROM ads WHERE id = ?`,
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Ad not found" });
        }

        res.json({ message: "Ad deleted successfully" });
    } catch (error) {
        console.error("DELETE /ads/:id error:", error);
        res.status(500).json({ message: "Error deleting ad", error: error.message });
    }
});

module.exports = router;
