const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const SPREADSHEETS = {
    hair: "1RUZMAygwKrmNw903-Wy3OWtvOu9KQpR-k4klNKTVxvA",
    skin: "1obAzYiOPTeMYJly3PC6iugdkpnU13cREBrXS3k-HBxk",
    pmu: "1zwEVINHui0KIHOlak0cd5Lf1SmLYpNofBwploWHsZaQ",
    weight_loss: "1ZgcJiNYJNQ80xoL-Y2W0rTPWFUho2mprIKmuSfB4igk",
};

(async () => {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    for (const [category, id] of Object.entries(SPREADSHEETS)) {
        try {
            await sheets.spreadsheets.get({ spreadsheetId: id });
            console.log(`✅ ${category}: access OK`);
        } catch (err) {
            console.log(`❌ ${category}: ${err.message}`);
        }
    }
})();