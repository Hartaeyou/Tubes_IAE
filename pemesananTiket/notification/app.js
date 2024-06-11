const amqp = require('amqplib');
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
const path = require('path');
const app = express();
const dotenv = require("dotenv");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');

dotenv.config();

const notification = [];
let userEmail = '';
console.log(userEmail);
const PORT = 2011;

const secret = 'FQzJPco+c2FTmS8Jh/QX4RUODZ0lsoIS0MWmqql35YX8O9WAyURZ5hmGbUoe50VX4npF9phnTZeTHQ1Rq2t/Xg==';

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/',  (req, res) => {
  token = req.headers.token;
  console.log('Token: ', token);
  res.json({ message: 'Token set successfully' });
});

const verifyToken = (req, res, next) => {
  console.log('Token from cookie:', token);
  
  if (!token) {
      return res.status(403).json({ message: 'Token is required!' });
  }
  try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
  } catch (err) {
      console.error('Invalid token error:', err);
      return res.status(401).json({ message: 'Invalid Token' });
  }
};

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



app.post('/set-email', verifyToken, (req, res) => {
  userEmail = req.body.email;
  console.log('User email set to:', userEmail);
  res.json({ message: 'Email address set successfully' });
});

app.post('/notification', verifyToken, (req, res) => {
  const notificationString = notification.map((item, index) =>
  `Order ${index + 1}:\nNama Tiket: ${item.ticketName}\nJumlah: ${item.quantity}\n`
  ).join('\n');

  console.log('Notification to be sent:', notificationString);

  const mail = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Your order has been confirmed",
    text: `Your order has been confirmed:\n\n${notificationString}`
  };

  transporter.sendMail(mail, (error) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "Error sending email" });
    } else {
      res.json({ message: "Notification sent to email" });
    }
  });
});

consumeMessage();

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
