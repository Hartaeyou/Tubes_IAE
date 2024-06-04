const express = require('express');
const supabase = require('@supabase/supabase-js');
const SUPABASE_URL = "https://xxfxbgsoiathxaqmowbt.supabase.co";
const SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZnhiZ3NvaWF0aHhhcW1vd2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzQxMjUyMSwiZXhwIjoyMDMyOTg4NTIxfQ.gG1-bY1gPbQWQHRINrHwTbiZrUgE2M0njUwIBaGDbsI";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
const app = express();
const PORT = 2002;
const path = require('path');
const cors = require('cors');
const secret = 'FQzJPco+c2FTmS8Jh/QX4RUODZ0lsoIS0MWmqql35YX8O9WAyURZ5hmGbUoe50VX4npF9phnTZeTHQ1Rq2t/Xg==';
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

app.post('/submitToken', (req, res) => {
    const { token } = req.body;
    console.log(token);
    try {
        const decoded = jwt.verify(token, secret);
        res.status(200).json({ message: "Token Verified" });
    } catch (err) {
        console.error("Invalid Token", err);
        res.status(401).json({ message: "Invalid Token" });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/data', async (req, res) => {
    const getData = await db.from("ticket").select();
    res.json({ getData });
});

app.listen(PORT, () => {
    console.log("Server started on port 2002");
});
