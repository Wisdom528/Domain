// Wait for page to fully load
document.addEventListener("DOMContentLoaded", () => {

let token = localStorage.getItem('token') || null;

// ------------------------
// AUTH UI UPDATE
// ------------------------
function updateAuthUI() {
    const authMessage = document.getElementById('authMessage');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboard = document.getElementById('dashboard');

    if (!authMessage) return; // prevent errors

    if(token){
        authMessage.innerText = "Logged in ✅";
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        dashboard.style.display = 'block';
        fetchUserDomains();
    } else {
        authMessage.innerText = "Not logged in";
        loginBtn.style.display = 'inline-block';
        signupBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        dashboard.style.display = 'none';
    }
}

// ------------------------
// AUTH EVENTS
// ------------------------
document.getElementById('loginBtn').onclick = () => {
    window.location.href = "login.html";
};

document.getElementById('signupBtn').onclick = () => {
    window.location.href = "signup.html";
};

document.getElementById('logoutBtn').onclick = () => {
    token = null;
    localStorage.removeItem('token');
    updateAuthUI();
};

// ------------------------
// DOMAIN SEARCH
// ------------------------
window.checkDomain = async function () {
    const domain = document.getElementById('domainInput').value;
    const resultDiv = document.getElementById('result');

    if(!domain) return alert("Enter a domain!");

    const res = await fetch('/check-domain', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({domain})
    });

    const data = await res.json();

    let html = '';

    if(data.available){
        html += `<strong>${data.domain}</strong> is available 🎉<br>`;
        html += `Price: $${data.price}<br>`;

        if(token){
            html += `<button onclick="buyDomain('${data.domain}', ${data.price})">Buy Now</button>`;
        } else {
            html += `<small>Login to buy</small>`;
        }
    } else {
        html += `<strong>${data.domain}</strong> is taken ❌`;
    }

    if(data.suggestions && data.suggestions.length > 0){
        html += '<div><h4>Suggestions:</h4>';

        data.suggestions.forEach(s => {
            html += `<div class="card"><strong>${s}</strong><br>`;
            if(token){
                html += `<button onclick="buyDomain('${s}', ${data.price})">Buy Now</button>`;
            }
            html += `</div>`;
        });

        html += '</div>';
    }

    resultDiv.innerHTML = html;
};

// ------------------------
// BUY DOMAIN (Crypto version placeholder)
// ------------------------
window.buyDomain = function(domain, price) {
    if(!token) return alert("Login required");

    // Here you will open your crypto payment modal (Bitcoin, Ethereum, Solana)
    // For now, just a placeholder
    alert(`You selected ${domain} for $${price}. Crypto payment modal goes here.`);
};

// ------------------------
// FETCH USER DOMAINS
// ------------------------
async function fetchUserDomains(){
    if(!token) return;

    const res = await fetch('/user-domains', {
        headers:{
            'Authorization':'Bearer ' + token
        }
    });

    const data = await res.json();
    const container = document.getElementById('userDomains');

    container.innerHTML = '';

    data.domains.forEach(d => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerText = d;
        container.appendChild(div);
    });
}

// Init UI
updateAuthUI();

});