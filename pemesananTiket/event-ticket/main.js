const express = require('express');
const supabase = require('@supabase/supabase-js');
const SUPABASE_URL = "https://xxfxbgsoiathxaqmowbt.supabase.co";
const SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZnhiZ3NvaWF0aHhhcW1vd2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzQxMjUyMSwiZXhwIjoyMDMyOTg4NTIxfQ.gG1-bY1gPbQWQHRINrHwTbiZrUgE2M0njUwIBaGDbsI";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
const app = express();
const PORT = 2002;
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.post('/submitToken', (req, res) => {
    const { token } = req.body;
    console.log(token);
    res.redirect('/');
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
