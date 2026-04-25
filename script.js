const apiKey = "c019492c73444c75a6c7264e0fdf3562";

let map;
let marker;

// Initialize map
function initMap(lat = 0, lon = 0) {
    if (map) map.remove();

    map = L.map('map').setView([lat, lon], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([lat, lon]).addTo(map);
}

initMap();

// 🌙 Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark");
}

// 📍 Auto-detect user IP
window.onload = async () => {
    displayHistory();

    try {
        const res = await fetch(`https://api.ipgeolocation.io/getip?apiKey=${apiKey}`);
        const data = await res.json();

        document.getElementById("ipInput").value = data.ip;
        checkIP(); // auto analyze
    } catch (e) {
        console.log("Auto IP fetch failed");
    }
};

async function getMyIP() {
    const resultDiv = document.getElementById("result");
    const loader = document.getElementById("loader");

    loader.classList.remove("hidden");
    resultDiv.innerHTML = "";

    try {
        // ✅ Get FULL info directly
        const response = await fetch(
            `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`
        );

        const data = await response.json();

        loader.classList.add("hidden");

        // ✅ Show your real data
        resultDiv.innerHTML = `
            <h2>📍 Your Network Info</h2>
            <p><b>IP:</b> ${data.ip}</p>
            <p><b>Country:</b> ${data.country_name}</p>
            <p><b>City:</b> ${data.city}</p>
            <p><b>ISP:</b> ${data.isp}</p>
            <p><b>Organization:</b> ${data.organization}</p>
            <p><b>Timezone:</b> ${data.time_zone.name}</p>
        `;

        // ✅ Update map
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        initMap(lat, lon);

        // ✅ Put IP in input box
        document.getElementById("ipInput").value = data.ip;

        addToHistory(data.ip);

    } catch (error) {
        loader.classList.add("hidden");
        resultDiv.innerHTML = "<p>Failed to get your IP info</p>";
        console.error(error);
    }
}
// 🔍 Main Function
async function checkIP() {
    const ip = document.getElementById("ipInput").value;
    const resultDiv = document.getElementById("result");
    const loader = document.getElementById("loader");

    if (!ip) {
        resultDiv.innerHTML = "<p>Please enter an IP address</p>";
        return;
    }

    loader.classList.remove("hidden");
    resultDiv.innerHTML = "";

    try {
        const response = await fetch(
            `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${ip}`
        );

        const data = await response.json();

        loader.classList.add("hidden");

        if (data.message) {
            resultDiv.innerHTML = "<p>Invalid IP address</p>";
            return;
        }

        // 🚨 Risk Analysis
        let risk = 0;
        let flags = [];

        if (data.isp.toLowerCase().includes("vpn")) {
            risk += 40;
            flags.push("VPN detected");
        }

        if (data.organization && data.organization.toLowerCase().includes("hosting")) {
            risk += 30;
            flags.push("Hosting provider");
        }

        if (data.connection_type === "cellular") {
            risk += 10;
        }

        if (risk === 0) {
            flags.push("No major threats");
        }

        // 📊 Risk Level
        let riskLevel = "Low";
        if (risk > 50) riskLevel = "High";
        else if (risk > 20) riskLevel = "Medium";

        // Display result
        resultDiv.innerHTML = `
            <h2>IP Details</h2>
            <p><b>IP:</b> ${data.ip}</p>
            <p><b>Country:</b> ${data.country_name}</p>
            <p><b>City:</b> ${data.city}</p>
            <p><b>ISP:</b> ${data.isp}</p>
            <p><b>Timezone:</b> ${data.time_zone.name}</p>

            <h3>⚠ Threat Analysis</h3>
            <p><b>Risk Score:</b> ${risk}</p>
            <p><b>Risk Level:</b> ${riskLevel}</p>
            <p><b>Flags:</b> ${flags.join(", ")}</p>
        `;

        // Update map
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        initMap(lat, lon);

        addToHistory(ip);

    } catch (error) {
        loader.classList.add("hidden");
        resultDiv.innerHTML = "<p>Error fetching data</p>";
        console.error(error);
    }
}

// 📜 History
function addToHistory(ip) {
    let history = JSON.parse(localStorage.getItem("ipHistory")) || [];

    if (!history.includes(ip)) {
        history.unshift(ip);
        if (history.length > 5) history.pop();
    }

    localStorage.setItem("ipHistory", JSON.stringify(history));
    displayHistory();
}

function displayHistory() {
    const historyList = document.getElementById("historyList");
    let history = JSON.parse(localStorage.getItem("ipHistory")) || [];

    historyList.innerHTML = "";

    history.forEach(ip => {
        const li = document.createElement("li");
        li.textContent = ip;
        li.onclick = () => {
            document.getElementById("ipInput").value = ip;
            checkIP();
        };
        historyList.appendChild(li);
    });
}