const express = require('express');
const amqp = require('amqplib');

const app = express();
const port = 3000;

let channel, connection;

// Middleware untuk parsing JSON
app.use(express.json());

// Connect ke RabbitMQ
async function connectRabbitMQ() {
    try {
        connection = await amqp.connect('amqp://localhost');
        channel = await connection.createChannel();
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.error('Error connecting to RabbitMQ', error);
    }
}

// Endpoint untuk membuat order
app.post('/order', async (req, res) => {
    const order = req.body;

    try {
        await channel.assertQueue('orderQueue');
        channel.sendToQueue('orderQueue', Buffer.from(JSON.stringify(order)));
        console.log('Order sent to queue', order);
        res.status(200).send('Order placed successfully');
    } catch (error) {
        console.error('Error sending order to queue', error);
        res.status(500).send('Error placing order');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Order service running on port ${port}`);
    connectRabbitMQ();
});

// Handle RabbitMQ connection close
process.on('exit', () => {
    if (connection) {
        connection.close();
    }
});
