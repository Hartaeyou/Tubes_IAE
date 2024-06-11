const express = require('express');
const supabase = require('@supabase/supabase-js');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const amqp = require('amqplib');
const SUPABASE_URL = 'https://xxfxbgsoiathxaqmowbt.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZnhiZ3NvaWF0aHhhcW1vd2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzQxMjUyMSwiZXhwIjoyMDMyOTg4NTIxfQ.gG1-bY1gPbQWQHRINrHwTbiZrUgE2M0njUwIBaGDbsI';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
const Producer = require('./producer');
const producer = new Producer();
const bodyParser = require('body-parser');

const app = express();
const PORT = 2002;


app.use(bodyParser.json("application/json"));
app.use(cors());
app.use(express.json());
app.use(cookieParser());
const secret = 'FQzJPco+c2FTmS8Jh/QX4RUODZ0lsoIS0MWmqql35YX8O9WAyURZ5hmGbUoe50VX4npF9phnTZeTHQ1Rq2t/Xg==';

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(403).json({ message: 'Token is required!' });
    }
    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid Token' });
    }
};

app.get('/', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/data', verifyToken, async (req, res) => {
    const { data, error } = await db.from('ticket').select();
    if (error) {
        res.status(500).json({ error: error.message });
    } else {
        res.json({ data });
    }
});

app.get('/submit/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { data, error } = await db.from('ticket').select().eq('id', id);

    if (error) {
        res.status(500).json({ error: error.message });
    } else if (data.length === 0) {
        res.status(404).json({ error: 'Ticket not found' });
    } else {
        res.json({ data: data }); // Mengembalikan tiket yang ditemukan
    }
});

app.post('/order', verifyToken, async (req, res) => {
    const { logType, message } = req.body;
    try {
        await producer.publishMessage(logType, message);
        res.status(200).json({ message: 'Order submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
 

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
