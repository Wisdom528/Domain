// server.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;

// -------------------------
// Fake in-memory database
// -------------------------
const users = [];
const takenDomains = ["google", "facebook", "amazon", "youtube", "twitter", "microsoft"];

// -------------------------
// Helper Functions
// -------------------------
function generateSuggestions(domain) {
  const suggestions = [];
  for (let i = 1; i <= 3; i++) {
    const suffix = Math.floor(Math.random() * 100);
    suggestions.push(`${domain}${suffix}.com`);
  }
  return suggestions;
}

function checkAvailability(domain) {
  const lower = domain.toLowerCase();
  const isTaken = takenDomains.some(word => lower.includes(word));
  const available = !isTaken && Math.random() > 0.3;
  const price = (Math.random() * 10 + 5).toFixed(2); // $5-$15
  return { available, price };
}

// -------------------------
// Middleware
// -------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token missing" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalid" });
    req.user = user;
    next();
  });
}

// -------------------------
// Serve Frontend
// -------------------------
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------------
// Auth Routes
// -------------------------
app.post("/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email & password required" });

  if (users.find(u => u.email === email))
    return res.status(400).json({ error: "Email already exists" });

  const newUser = { email, password, domains: [] };
  users.push(newUser);

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "Signup successful", token });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user)
    return res.status(400).json({ error: "Invalid email or password" });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ message: "Login successful", token });
});

// -------------------------
// Domain Routes
// -------------------------
app.post("/check-domain", (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain required" });

  const { available, price } = checkAvailability(domain);
  const suggestions = generateSuggestions(domain);

  res.json({
    domain: domain + ".com",
    available,
    price,
    suggestions
  });
});

// -------------------------
// Create Crypto Payment (NowPayments)
// -------------------------
app.post("/create-payment", authenticateToken, async (req, res) => {
  const { domain, crypto } = req.body;
  const user = users.find(u => u.email === req.user.email);

  if (!domain) return res.status(400).json({ error: "Domain required" });
  if (!crypto) return res.status(400).json({ error: "Crypto required" });

  const { available, price } = checkAvailability(domain);
  if (!available) return res.status(400).json({ error: "Domain is already taken" });

  try {
    const response = await axios.post(
      "https://api.nowpayments.io/v1/invoice",
      {
        price_amount: price,          // USD price
        price_currency: "usd",
        pay_currency: crypto.toLowerCase(), // bitcoin, ethereum, solana
        order_id: `${domain}-${Date.now()}`,
        order_description: `Purchase domain ${domain}`,
        ipn_callback_url: "https://yourdomain.com/webhook" // replace with your webhook URL
      },
      {
        headers: {
          "x-api-key": NOWPAYMENTS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ paymentUrl: response.data.invoice_url });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

// -------------------------
// Webhook to Confirm Payment
// -------------------------
app.post("/webhook", express.json(), (req, res) => {
  const data = req.body;

  // Only confirm payment if data.status === "finished"
  if (data.status === "finished") {
    const [domainName] = data.order_id.split("-"); // domain stored in order_id
    const user = users.find(u => u.email === data.payer_email);

    if (user && domainName) {
      user.domains.push(domainName + ".com");
      takenDomains.push(domainName.toLowerCase());
    }
  }

  res.sendStatus(200);
});

// -------------------------
// User Domains
// -------------------------
app.get("/user-domains", authenticateToken, (req, res) => {
  const user = users.find(u => u.email === req.user.email);
  res.json({ domains: user.domains });
});

// -------------------------
// Start Server
// -------------------------
app.listen(PORT, () => {
  console.log(`DomainNest running on http://localhost:${PORT}`);
});