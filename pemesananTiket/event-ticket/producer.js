const amqp = require('amqplib');
const config = require('./config');

class Producer {
    constructor() {
        this.channel = null;
    }

    async createChannel() {
        const conn = await amqp.connect(config.rabbitMQ.url);
        this.channel = await conn.createChannel();
    }

    async publishMessage(routingKey, message) {
        if (!this.channel) {
            await this.createChannel();
        }
        const exchangeName = config.rabbitMQ.exchangeName;
        await this.channel.assertExchange(exchangeName, 'direct');

        const content = {
            logType: routingKey,
            message: message,
            dateTime: new Date()
        };

        await this.channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(content)));
        console.log(`The message "${message}" is sent to exchange "${exchangeName}" with routing key "${routingKey}"`);
    }
}

module.exports = Producer;
