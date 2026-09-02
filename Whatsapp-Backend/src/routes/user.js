const express = require("express");
const router = express.Router();

const pool = require("../db");

/*
 * Register User
 */
router.post("/register", async (req, res) => {

    try {

    const {
      name,
      email,
      password,
      category,
      subcategory,
      centre
    } = req.body;

        const [existingUser] =
            await pool.execute(
                `
                SELECT id
                FROM users
                WHERE email = ?
                `,
                [email]
            );

        if (existingUser.length) {

            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const [result] =
            await pool.execute(
                `
                INSERT INTO users
                (
                name,
                email,
                password,
                category,
                subcategory,
                centre,
                created_at
                )
                VALUES
                (
                ?, ?, ?, ?, ?, ?, NOW()
                )
                `,
                [
                    name,
                    email,
                    password,
                    category,
                    subcategory,
                    centre
                ]
            );

        res.json({
            message: "User Registered",
            userId: result.insertId
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
});

/*
 * Login User
 */
router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const [rows] =
            await pool.execute(
                `
                SELECT *
                FROM users
                WHERE email = ?
                AND password = ?
                `,
                [
                    email,
                    password
                ]
            );

        if (!rows.length) {

            return res.status(401).json({
                message: "Invalid Credentials"
            });
        }

        res.json({
            message: "Login Successful",
            user: rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
});

/*
 * Update user category
 */
router.put(
    "/profile/:id",
    async (req, res) => {

        try {

            const userId =
                req.params.id;

            const {
                category,
                subcategory,
                centre
            } = req.body;

            await pool.execute(
                `
                UPDATE users
                SET
                category = ?,
                subcategory = ?,
                centre = ?
                WHERE id = ?
                `,
                [
                    category,
                    subcategory,
                    centre,
                    userId
                ]
            );

            res.json({
                message:
                    "category updated successfully"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message:
                    "Server Error"
            });
        }
    }
);

module.exports = router;