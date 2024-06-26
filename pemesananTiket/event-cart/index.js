const amqp = require('amqplib');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const app = express();
const PORT = 2010;


const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1a3pnaWp2cGRyeW55dnF5dWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgwMzUxNDksImV4cCI6MjAzMzYxMTE0OX0.r-jkjZ1huwzmDnskM4LQR9TZeMZNNxdHn-yNK5XpOaI'
const SUPABASE_URL = 'https://bukzgijvpdrynyvqyulo.supabase.co';
const supabase = createClient(SUPABASE_URL, supabaseKey);
const secret = 'FQzJPco+c2FTmS8Jh/QX4RUODZ0lsoIS0MWmqql35YX8O9WAyURZ5hmGbUoe50VX4npF9phnTZeTHQ1Rq2t/Xg==';
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const allOrders = [];

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));


const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    console.log(token);
    
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


// Fungsi untuk mengonsumsi pesan dari RabbitMQ
async function consumeMessage() {
    try {
        const conn = await amqp.connect('amqp://localhost');
        const channel = await conn.createChannel();

        await channel.assertExchange('orders', 'direct');
        const q = await channel.assertQueue('ordersInput');
        await channel.bindQueue(q.queue, 'orders', 'orders');

        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                const valueMessage = JSON.parse(data.message);

                valueMessage.forEach(order => {
                    allOrders.push(order);
                });

                console.log("Received orders:", allOrders);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("Error in consumeMessage:", error);
    }
}

// Fungsi untuk mem-publish data ke exchange 'confirmed'
async function publishConfirmed(data) {
    try {
        const conn = await amqp.connect('amqp://localhost');
        const channel = await conn.createChannel();

        await channel.assertExchange('confirmed', 'fanout');
        const message = JSON.stringify(data);
        channel.publish('confirmed', '', Buffer.from(message));
        console.log('Data published to confirmed exchange');

        await channel.close();
        await conn.close();
    } catch (error) {
        console.error("Error in publishConfirmed:", error);
    }
}

// Route untuk menampilkan halaman cart
app.get('/cart', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'cart.html'));
});

// Route untuk mengirim data orders dalam format JSON
app.get('/api/orders', verifyToken, (req, res) => {
    res.json(allOrders);
});

// Route untuk mem-publish data orders ke exchange 'confirmed'
app.post('/cart/confirm', verifyToken, async (req, res) => {
    const token = req.cookies.token;
    console.log(token);
    try {
        // Simpan data ke Supabase dalam bentuk JSON
        const { data, error } = await supabase
            .from('order')
            .insert([{ detailOrder: allOrders }])
            .select();

        if (error) {
            throw error;
        }

        const sendToken = "http://localhost:2011"
        await fetch(sendToken, { 
            method: "GET", 
            headers: {
                'Content-Type': 'application/json',
                'token' : token
            },
            
        })
        await publishConfirmed(allOrders);
        const notification = "http://localhost:2011/notification";
        await fetch(notification, { 
            method: "POST", 
            body: JSON.stringify({ token: token })
    
    });

        res.send('<p>Data confirmed and published!</p><a href="/cart">Back to Cart</a>');
    } catch (error) {
        console.error("Error publishing confirmed data:", error);
        res.status(500).send('<p>Error publishing data. Please try again.</p><a href="/cart">Back to Cart</a>');
    }
});

// Mulai mengonsumsi pesan dan mendengarkan di port 2010
consumeMessage();
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
