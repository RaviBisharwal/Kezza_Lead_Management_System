const cors = require("cors");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const userRoutes = require("./routes/user");
const whatsappRoutes = require("./routes/whatsapp");
const adsRoutes = require("./routes/ads");

const app = express();
app.use(cors());

app.use(express.json());

/*
 * Create HTTP server
 */
const server = http.createServer(app);

/*
 * Create WebSocket server
 */
const wss = new WebSocket.Server({
    server
});

/*
 * Save wss globally
 */
app.set("wss", wss);

wss.on("connection", ws => {

    console.log(
        "Frontend Connected To WebSocket"
    );

    ws.on("close", () => {

        console.log(
            "Frontend Disconnected"
        );
    });
});

app.use(
    "/users",
    userRoutes
);

app.use(
    "/ads",
    adsRoutes
);

app.use(
    "/whatsapp",
    (req, res, next) => {

        req.wss = wss;
        next();

    },
    whatsappRoutes
);

app.get("/", (req, res) => {

    res.send(
        "Server Running"
    );
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server Started On Port ${PORT}`);
    try {
        await seedAds();
    } catch (err) {
        console.error("Error running seedAds during startup:", err.message);
    }
});