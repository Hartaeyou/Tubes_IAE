const express = require("express");
const supabase = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path = require("path");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
app.use(express.json());



const Supabase_URl = process.env.SUPABASE_URL;
const Supabase_Key = process.env.SUPABASE_KEY;
const secret = process.env.SUPABASE_SECRET;

const db = supabase.createClient(Supabase_URl, Supabase_Key);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS  
    },
    debug: true
  });

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "Token is required!" });
  }
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/verified", verifyToken, async (req, res) => {
  try {
      const redirectTo = 'http://localhost:2002';
      console.log('Redirecting to:', redirectTo);
      res.redirect(redirectTo);
  } catch (error) {
      console.error('Error during redirection:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await db.from("login_tubes").select().eq("email", email).eq("password", password);
    if (error) {
      throw error;
    }
    if (data && data.length > 0) {
      const token = jwt.sign({ email, password }, secret);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Login Token',
        text: `Here is your login token: ${token}`
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ message: "Error sending email" });
        } else {
            res.json({ message: "Token sent to email" });
        }
    });
    
    } else {
      res.status(401).json({ message: "Invalid email" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(2001, () => {
  console.log("Server started on port 2001");
});
