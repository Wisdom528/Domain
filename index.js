// index.js
document.addEventListener("DOMContentLoaded", () => {

  let token = localStorage.getItem("token") || null;

  // ------------------------
  // AUTH UI UPDATE
  // ------------------------
  function updateAuthUI() {
    const authMessage = document.getElementById("authMessage");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const dashboard = document.getElementById("dashboard");

    if (!authMessage) return;

    if (token) {
      authMessage.innerText = "Logged in ✅";
      loginBtn.style.display = "none";
      signupBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      dashboard.style.display = "block";
      fetchUserDomains();
    } else {
      authMessage.innerText = "Not logged in";
      loginBtn.style.display = "inline-block";
      signupBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      dashboard.style.display = "none";
    }
  }

  // ------------------------
  // AUTH EVENTS
  // ------------------------
  document.getElementById("loginBtn").onclick = async () => {
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    if (!email || !password) return;

    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token) {
      token = data.token;
      localStorage.setItem("token", token);
      updateAuthUI();
      alert(data.message);
    } else {
      alert(data.error);
    }
  };

  document.getElementById("signupBtn").onclick = async () => {
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    if (!email || !password) return;

    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token) {
      token = data.token;
      localStorage.setItem("token", token);
      updateAuthUI();
      alert(data.message);
    } else {
      alert(data.error);
    }
  };

  document.getElementById("logoutBtn").onclick = () => {
    token = null;
    localStorage.removeItem("token");
    updateAuthUI();
  };

  // ------------------------
  // DOMAIN SEARCH
  // ------------------------
  window.checkDomain = async function () {
    const domain = document.getElementById("domainInput").value;
    const resultDiv = document.getElementById("result");
    if (!domain) return alert("Enter a domain!");

    const res = await fetch("/check-domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });

    const data = await res.json();

    let html = "";

    if (data.available) {
      html += `<strong>${data.domain}</strong> is available 🎉<br>`;
      html += `Price: $${data.price}<br>`;

      if (token) {
        html += `
          <div class="crypto-options">
            <p>Select Crypto to Pay:</p>
            <button onclick="buyDomain('${data.domain}', 'bitcoin', ${data.price})">
              <img src="images/bitcoin.png" alt="BTC" class="crypto-logo"> Bitcoin
            </button>
            <button onclick="buyDomain('${data.domain}', 'ethereum', ${data.price})">
              <img src="images/ethereum.png" alt="ETH" class="crypto-logo"> Ethereum
            </button>
            <button onclick="buyDomain('${data.domain}', 'solana', ${data.price})">
              <img src="images/solana.png" alt="SOL" class="crypto-logo"> Solana
            </button>
          </div>
        `;
      } else {
        html += `<small>Login to buy</small>`;
      }
    } else {
      html += `<strong>${data.domain}</strong> is taken ❌`;
    }

    if (data.suggestions && data.suggestions.length > 0) {
      html += "<div><h4>Suggestions:</h4>";
      data.suggestions.forEach((s) => {
        html += `<div class="card"><strong>${s}</strong><br>`;
        if (token) {
          html += `
            <div class="crypto-options">
              <button onclick="buyDomain('${s}', 'bitcoin', ${data.price})">
                <img src="images/bitcoin.png" class="crypto-logo"> BTC
              </button>
              <button onclick="buyDomain('${s}', 'ethereum', ${data.price})">
                <img src="images/ethereum.png" class="crypto-logo"> ETH
              </button>
              <button onclick="buyDomain('${s}', 'solana', ${data.price})">
                <img src="images/solana.png" class="crypto-logo"> SOL
              </button>
            </div>
          `;
        }
        html += "</div>";
      });
      html += "</div>";
    }

    resultDiv.innerHTML = html;
  };

  // ------------------------
  // BUY DOMAIN VIA CRYPTO
  // ------------------------
  window.buyDomain = async function (domain, crypto, price) {
    if (!token) return alert("Login required");

    try {
      const res = await fetch("/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ domain, crypto }),
      });

      const data = await res.json();

      if (data.paymentUrl) {
        // Open NowPayments payment page
        window.open(data.paymentUrl, "_blank");
        alert(
          `Payment page opened! Complete payment using ${crypto.toUpperCase()}. The domain will appear in your dashboard after payment is confirmed.`
        );
      } else {
        alert("Failed to create payment.");
      }
    } catch (err) {
      console.error(err);
      alert("Error initiating crypto payment.");
    }
  };

  // ------------------------
  // FETCH USER DOMAINS
  // ------------------------
  async function fetchUserDomains() {
    if (!token) return;

    const res = await fetch("/user-domains", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await res.json();
    const container = document.getElementById("userDomains");

    container.innerHTML = "";

    data.domains.forEach((d) => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerText = d;
      container.appendChild(div);
    });
  }

  // Init UI
  updateAuthUI();
});