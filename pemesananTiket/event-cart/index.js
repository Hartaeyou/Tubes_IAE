const amqp = require('amqplib');
const allOrders = [];

async function consumeMessage() {
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

            
            channel.ack(msg);
        }
    });
}

consumeMessage();
