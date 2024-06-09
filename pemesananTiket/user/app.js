const express = require('express');
const app = express();
const PORT = 2010;
const amqp = require('amqplib');

let rabbitMQConnection;
const queueName = "order";
const messagesStorage = [];

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/messages', (req, res) => {
  try {
    return res.json({ messages: messagesStorage });
  } catch (error) {
    return res.status(500).json({
      detail: error.message
    });
  }
});

// Function to handle user confirmation
function handleUserConfirmation(receivedJSON) {
  // Implement your user confirmation logic here
  // For example, display a confirmation page or prompt
  // Once confirmed, send the object to the "confirmed" exchange
  // ...
}

async function listenMessages() {
  try {
    const channel = await rabbitMQConnection.createChannel();
    await channel.assertQueue(queueName, { durable: false });
    channel.consume(queueName, (message) => {
      if (message !== null) {
        const receivedJSON = JSON.parse(message.content.toString());
        console.log(`Received data order:`, receivedJSON);
        messagesStorage.push(receivedJSON);

        // Handle user confirmation
        handleUserConfirmation(receivedJSON);

        channel.ack(message);
      }
    });
  } catch (error) {
    console.error('Error consuming user requests:', error);
  }
}

amqp.connect('amqp://localhost').then(async (connection) => {
  rabbitMQConnection = connection;
  listenMessages();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
