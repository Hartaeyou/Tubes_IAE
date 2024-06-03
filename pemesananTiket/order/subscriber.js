const amqp = require('amqplib');

async function connect() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        await channel.assertQueue('orderQueue');

        console.log('Waiting for messages in orderQueue');

        channel.consume('orderQueue', message => {
            const order = JSON.parse(message.content.toString());
            console.log('Received order:', order);

            // Acknowledge the message
            channel.ack(message);

            // Proses order di sini
        });
    } catch (error) {
        console.error('Error connecting to RabbitMQ', error);
    }
}

connect();
