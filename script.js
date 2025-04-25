// script.js - Código Completo Atualizado
const shortenBtn = document.getElementById("shortenBtn");
const linkInput = document.getElementById("linkInput");
const resultDiv = document.getElementById("result");
const shortLinkInput = document.getElementById("shortLink");
const copyBtn = document.getElementById("copyBtn");
const linkList = document.createElement("ul");
linkList.className = "link-list";
document.querySelector(".container").appendChild(linkList);

// Notificação estilizada
function showNotification(message, isSuccess = true) {
  const notification = document.createElement("div");
  notification.className = `notification ${isSuccess ? "success" : "error"}`;
  notification.innerHTML = `
    <span>${isSuccess ? '✓' : '✗'}</span>
    <p>${message}</p>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Carrega links salvos
let savedLinks = JSON.parse(localStorage.getItem("shortenedLinks")) || [];
savedLinks.forEach(link => addLinkToList(link.original, link.short));

// Encurta URL
shortenBtn.addEventListener("click", async () => {
  const longUrl = linkInput.value.trim();

  if (!longUrl) {
    showNotification("Por favor, cole um link!", false);
    return;
  }

  shortenBtn.disabled = true;
  shortenBtn.innerHTML = '<div class="loader"></div> Encurtando...';

  try {
    // Tenta a API shrtco.de primeiro
    let shortUrl;
    try {
      const response = await fetch(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(longUrl)}`);
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || "API falhou");
      shortUrl = data.result.full_short_link;
    } catch (err) {
      // Fallback para TinyURL
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      if (!response.ok) throw new Error("Fallback falhou");
      shortUrl = await response.text();
    }

    shortLinkInput.value = shortUrl;
    resultDiv.classList.remove("hidden");

    // Adiciona apenas se for novo
    if (!savedLinks.some(link => link.original === longUrl)) {
      savedLinks.push({ original: longUrl, short: shortUrl });
      localStorage.setItem("shortenedLinks", JSON.stringify(savedLinks));
      addLinkToList(longUrl, shortUrl);
    }

    showNotification("Link encurtado com sucesso!");

  } catch (error) {
    console.error("Erro:", error);
    showNotification(`Falha ao encurtar: ${error.message}`, false);
  } finally {
    shortenBtn.disabled = false;
    shortenBtn.textContent = "Encurtar";
  }
});

// Copiar link
copyBtn.addEventListener("click", () => {
  shortLinkInput.select();
  navigator.clipboard.writeText(shortLinkInput.value);
  showNotification("Link copiado para a área de transferência!");
});

// Adiciona link à lista com botão de remoção
function addLinkToList(original, short) {
  const listItem = document.createElement("li");
  listItem.className = "link-item";
  listItem.innerHTML = `
    <div class="link-info">
      <span class="original-url" title="${original}">${truncateText(original, 30)}</span>
      <span class="separator">→</span>
      <a href="${short}" target="_blank" class="short-url">${short.replace('https://', '')}</a>
    </div>
    <div class="link-actions">
      <button class="action-btn copy-btn" data-url="${short}" title="Copiar">
        <span class="icon">📋</span>
      </button>
      <button class="action-btn delete-btn" data-url="${original}" title="Remover">
        <span class="icon">🗑️</span>
      </button>
    </div>
  `;

  linkList.prepend(listItem); // Adiciona no topo

  // Event listeners
  listItem.querySelector(".copy-btn").addEventListener("click", (e) => {
    navigator.clipboard.writeText(e.currentTarget.dataset.url);
    showNotification("Link copiado!");
  });

  listItem.querySelector(".delete-btn").addEventListener("click", (e) => {
    const originalUrl = e.currentTarget.dataset.url;
    savedLinks = savedLinks.filter(link => link.original !== originalUrl);
    localStorage.setItem("shortenedLinks", JSON.stringify(savedLinks));
    listItem.classList.add("removing");
    setTimeout(() => listItem.remove(), 300);
    showNotification("Link removido", false);
  });
}

// Helper para truncar texto
function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
