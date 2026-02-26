const clientId = "bff0d77c-cb49-44ed-8b5f-ce68d08d3c8d";

const redirectUri = "https://philenosborne.github.io/homeOS/";

// konfa MSAL
const msalConfig = {
  auth: {
    clientId,
    authority: "https://login.microsoftonline.com/common",
    redirectUri,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

await msalInstance.Initialize();

const msalInstance = new msal.PublicClientApplication(msalConfig);

const statusEl = document.getElementById("status");
const outEl = document.getElementById("out");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const btnLoad = document.getElementById("btnLoad");

function setStatus(msg) { statusEl.textContent = msg; }
function out(msg) { outEl.textContent = msg; }

function getAccount() {
  const accounts = msalInstance.getAllAccounts();
  return accounts.length ? accounts[0] : null;
}

function refreshUI() {
  const acc = getAccount();
  const loggedIn = !!acc;
  btnLogout.disabled = !loggedIn;
  btnLoad.disabled = !loggedIn;
  setStatus(loggedIn ? `Inloggad: ${acc.username}` : "Inte inloggad.");
}

btnLogin.addEventListener("click", async () => {
  try {
    await msalInstance.loginPopup({
      scopes: ["User.Read", "Files.Read"],
      prompt: "select_account",
    });
    refreshUI();
    out("Inloggning OK.");
  } catch (e) {
    out("Login-fel:\n" + (e?.message ?? String(e)));
  }
});

btnLogout.addEventListener("click", async () => {
  const acc = getAccount();
  if (!acc) return;
  await msalInstance.logoutPopup({ account: acc });
  refreshUI();
  out("Utloggad.");
});

btnLoad.addEventListener("click", async () => {
  try {
    const acc = getAccount();
    if (!acc) throw new Error("Inte inloggad.");

    // Hämta token för Graph
    const token = await msalInstance.acquireTokenSilent({
      account: acc,
      scopes: ["Files.Read"],
    });

    // Läs money.csv i /HemOS_Data/ på OneDrive
    const filePath = "/HemOS_Data/money.csv";
    const url = `https://graph.microsoft.com/v1.0/me/drive/root:${filePath}:/content`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Graph ${res.status}:\n${t}`);
    }

    const csv = await res.text();
    out(csv.slice(0, 4000)); // visa början
  } catch (e) {
    out("Load-fel:\n" + (e?.message ?? String(e)));
  }
});

refreshUI();
