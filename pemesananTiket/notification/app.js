const amqp = require('amqplib');
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
const path = require('path');
const app = express();
const dotenv = require("dotenv");


const notification = [];
let userEmail = '';
const PORT = 2011;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
dotenv.config();


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true,
});

async function consumeMessage() {
  try {
      const conn = await amqp.connect('amqp://localhost');
      const channel = await conn.createChannel();

      await channel.assertExchange('confirmed', 'fanout');
      const q = await channel.assertQueue('notification');
      await channel.bindQueue(q.queue, 'confirmed', 'confirmed');

      channel.consume(q.queue, (msg) => {
          if (msg !== null) {
              const data = JSON.parse(msg.content.toString());
              data.forEach(cart => {
                notification.push(cart);
              });

              console.log("Received orders for notif:", notification);
              channel.ack(msg);
          }
      });
  } catch (error) {
      console.error("Error in consumeMessage:", error);
  }
}

app.post('/set-email', (req, res) => {
  userEmail = req.body.email;
  res.json({ message: 'Email address set successfully' });
});

app.post('/notification', (res) => {
  const notificationString = notification.map((item, index) =>
  `Order ${index + 1}:\nNama Tiket: ${item.ticketName}\nJumlah: ${item.quantity}\n`
  ).join('\n');
  console.log(notification);
  const mail = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Your order has been confirmed",
    text: `Your order has been confirmed:\n\n${notificationString}`
    ,
  };
  transporter.sendMail(mail, (error) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      res.json({ message: "notification sent to email" });
    }
  });


});


consumeMessage();



app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
