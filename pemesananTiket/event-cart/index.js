const amqp = require('amqplib');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

const allOrders = [];
const PORT = 2010;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'cart.html'));
});

// Route untuk mengirim data orders dalam format JSON
app.get('/api/orders', (req, res) => {
    res.json(allOrders);
});

// Route untuk mem-publish data orders ke exchange 'confirmed'
app.post('/cart/confirm', (req, res) => {
    publishConfirmed(allOrders)
        .then(() => {
            res.send('<p>Data confirmed and published!</p><a href="/cart">Back to Cart</a>');
        })
        .catch(error => {
            console.error("Error publishing confirmed data:", error);
            res.status(500).send('<p>Error publishing data. Please try again.</p><a href="/cart">Back to Cart</a>');
        });
});

// Mulai mengonsumsi pesan dan mendengarkan di port 2010
consumeMessage();
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
