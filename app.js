const STORE_KEY = "oxente_site_v1";
const TEMP_MONTAGEM_KEY = "oxente_temp_montagem_v1";

const LIMITES = {
  oxente: { sabor: 1, recheio: 0, mix: 0 },
  arrochado: { sabor: 1, recheio: 2, mix: 1 },
  cabra_macho: { sabor: 1, recheio: 3, mix: 1 }
};

const BASE_PASTEIS = {
  oxente: { nome: "Pastel Oxente", preco: 13.99 },
  arrochado: { nome: "Pastel Arrochado", preco: 17.99 },
  cabra_macho: { nome: "Pastel Cabra Macho", preco: 19.99 }
};

const OPCOES = {
  sabor: [
    { id: "frango", nome: "Frango", extra: 0 },
    { id: "calabresa", nome: "Calabresa", extra: 0 },
    { id: "queijo", nome: "Queijo", extra: 0 },
    { id: "carne", nome: "Carne", extra: 0 },
    { id: "carne_de_sol", nome: "Carne de Sol", extra: 2 }
  ],
  recheio: [
    { id: "cebola", nome: "Cebola" },
    { id: "bacon", nome: "Bacon" },
    { id: "tomate", nome: "Tomate" },
    { id: "presunto", nome: "Presunto" },
    { id: "milho", nome: "Milho" },
    { id: "queijo_coalho", nome: "Queijo coalho" },
    { id: "mussarela", nome: "Mussarela" },
    { id: "oregano", nome: "Orégano" },
    { id: "azeitona", nome: "Azeitona" }
  ],
  mix: [
    { id: "catupiry", nome: "Catupiry" },
    { id: "cheddar", nome: "Cheddar" },
    { id: "requeijao", nome: "Requeijão" },
    { id: "cream_cheese", nome: "Cream Cheese" }
  ]
};

const CLICK_GUARD = {};
const CLICK_DELAY = 220;

function canRunClick(actionKey) {
  const now = Date.now();

  if (CLICK_GUARD[actionKey] && now - CLICK_GUARD[actionKey] < CLICK_DELAY) {
    return false;
  }

  CLICK_GUARD[actionKey] = now;
  return true;
}

function money(v) {
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

function initialStore() {
  return {
    flow: "",
    items: [],
    delivery: {
      nome: "",
      endereco: "",
      referencia: ""
    },
    payment: "",
    acompanhamentos: {
      fritasCarneSolExtra: ""
    }
  };
}

function getStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || JSON.stringify(initialStore()));
    return parsed && typeof parsed === "object" ? parsed : initialStore();
  } catch (error) {
    return initialStore();
  }
}

function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  updateCartBadge();
  renderQtyControls();
  renderCartDrawer();
  renderResumo();
  renderPaymentSummary();
  renderFritasExtra();
}

function setFlow(flow) {
  const store = getStore();
  store.flow = flow;
  saveStore(store);
}

function getFlow() {
  return getStore().flow || "";
}

function goToFlow(flow, page) {
  setFlow(flow);
  window.location.href = page;
}

function clearAllData() {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(TEMP_MONTAGEM_KEY);
  updateCartBadge();
  renderQtyControls();
  renderCartDrawer();
  renderResumo();
  renderPaymentSummary();
  renderFritasExtra();
}

function progressMap(page) {
  const map = {
    index: 8,
    combos: 22,
    pasteis: 20,
    "montagem-pastel": 36,
    "viva-nordeste": 22,
    acompanhamentos: 56,
    bebidas: 74,
    resumo: 86,
    entrega: 94,
    pagamento: 100
  };
  return map[page] || 0;
}

function setProgress(page) {
  const value = progressMap(page);
  document.querySelectorAll("[data-progress-fill]").forEach(el => {
    el.style.width = value + "%";
  });
}

function updateCartBadge() {
  const totalItems = getStore().items.reduce((acc, item) => acc + Number(item.qty || 0), 0);

  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = totalItems;
  });

  document.querySelectorAll(".cart-total").forEach(el => {
    el.textContent = money(getTotalValue());
  });
}

function getTotalValue() {
  return getStore().items.reduce((acc, item) => {
    return acc + (Number(item.qty || 0) * Number(item.price || 0));
  }, 0);
}

function addQty(key, name, price) {
  if (!canRunClick("add_" + key)) return;

  const store = getStore();
  const found = store.items.find(item => item.key === key);

  if (found) {
    found.qty = Number(found.qty) + 1;
  } else {
    store.items.push({
      key: key,
      name: name,
      price: Number(price),
      qty: 1
    });
  }

  saveStore(store);
}

function decQty(key) {
  if (!canRunClick("dec_" + key)) return;

  const store = getStore();
  const found = store.items.find(item => item.key === key);

  if (!found) return;

  found.qty = Number(found.qty) - 1;

  if (found.qty <= 0) {
    store.items = store.items.filter(item => item.key !== key);
  }

  if (key === "comp-fritas-carne-sol" && !store.items.find(item => item.key === "comp-fritas-carne-sol")) {
    store.acompanhamentos.fritasCarneSolExtra = "";
  }

  saveStore(store);
}

function removeLine(key) {
  if (!canRunClick("remove_" + key)) return;

  const store = getStore();
  store.items = store.items.filter(item => item.key !== key);

  if (key === "comp-fritas-carne-sol") {
    store.acompanhamentos.fritasCarneSolExtra = "";
  }

  saveStore(store);
}

function getQty(key) {
  const item = getStore().items.find(i => i.key === key);
  return item ? Number(item.qty) : 0;
}

function renderQtyControls() {
  document.querySelectorAll("[data-key]").forEach(box => {
    const key = box.dataset.key;
    const value = box.querySelector("[data-qty-value]");
    if (value) {
      value.textContent = String(getQty(key));
    }
  });
}

function toggleCart(force) {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");

  if (!drawer || !overlay) return;

  const open = typeof force === "boolean" ? force : !drawer.classList.contains("show");
  drawer.classList.toggle("show", open);
  overlay.classList.toggle("show", open);
}

function openCart() {
  toggleCart(true);
}

function closeCart() {
  toggleCart(false);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeJsString(str) {
  return String(str)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"')
    .replaceAll("\n", " ")
    .replaceAll("\r", " ");
}

function renderCartDrawer() {
  const wrap = document.getElementById("cartItems");
  if (!wrap) return;

  const items = getStore().items;

  if (!items.length) {
    wrap.innerHTML = `
      <div class="summary-box">
        <div class="empty-text">Seu pedido está vazio. Adicione itens para continuar.</div>
      </div>
    `;
    return;
  }

  let html = "";

  items.forEach(item => {
    const safeKeyHtml = escapeHtml(item.key);
    const safeKeyJs = escapeJsString(item.key);
    const safeNameJs = escapeJsString(item.name);

    html += `
      <div class="drawer-line">
        <div class="drawer-line-top">
          <div>
            <div class="drawer-line-title">${escapeHtml(item.name)}</div>
            <div class="drawer-line-price">${money(item.price)}</div>
          </div>
          <div class="qty" data-key="${safeKeyHtml}">
            <button type="button" class="qty-btn" onclick="decQty('${safeKeyJs}')">-</button>
            <span class="qty-value" data-qty-value>${Number(item.qty)}</span>
            <button type="button" class="qty-btn" onclick="addQty('${safeKeyJs}','${safeNameJs}',${Number(item.price)})">+</button>
          </div>
        </div>
        <div class="drawer-line-bottom">
          <button type="button" class="remove-btn" onclick="removeLine('${safeKeyJs}')">remover item</button>
          <strong>${money(Number(item.qty) * Number(item.price))}</strong>
        </div>
      </div>
    `;
  });

  html += `
    <div class="summary-box" style="margin-top:6px;">
      <div class="summary-total">
        <span>Total</span>
        <span>${money(getTotalValue())}</span>
      </div>
    </div>
  `;

  wrap.innerHTML = html;
}

function prevPageFor(page) {
  const flow = getFlow();

  if (page === "pagamento") return "entrega.html";
  if (page === "entrega") return "resumo.html";
  if (page === "resumo") return "bebidas.html";
  if (page === "bebidas") return "acompanhamentos.html";

  if (page === "acompanhamentos") {
    if (flow === "combos") return "combos.html";
    if (flow === "montagem") return "montagem-pastel.html";
    if (flow === "nordeste") return "viva-nordeste.html";
  }

  if (page === "montagem-pastel") return "pasteis.html";

  return "index.html";
}

function goPrev(page) {
  window.location.href = prevPageFor(page);
}

function getTempMontagem() {
  try {
    return JSON.parse(localStorage.getItem(TEMP_MONTAGEM_KEY) || '{"tipo":"","sabor":[],"recheio":[],"mix":[]}');
  } catch (error) {
    return { tipo: "", sabor: [], recheio: [], mix: [] };
  }
}

function saveTempMontagem(data) {
  localStorage.setItem(TEMP_MONTAGEM_KEY, JSON.stringify(data));
}

function setPastelType(tipo) {
  saveTempMontagem({
    tipo,
    sabor: [],
    recheio: [],
    mix: []
  });

  document.querySelectorAll(".select-card").forEach(card => card.classList.remove("active"));

  const selected = document.querySelector(`[data-pastel-type="${tipo}"]`);
  if (selected) selected.classList.add("active");

  const btn = document.getElementById("btnContinuarPastel");
  if (btn) {
    btn.classList.remove("btn-disabled");
    btn.removeAttribute("disabled");
  }

  renderMontagemPage();
}

function getOptionName(group, id) {
  const found = OPCOES[group].find(opt => opt.id === id);
  return found ? found.nome : id;
}

function getMontagemExtra(montagem) {
  let extra = 0;

  montagem.sabor.forEach(id => {
    const found = OPCOES.sabor.find(opt => opt.id === id);
    if (found && found.extra) {
      extra += Number(found.extra);
    }
  });

  return extra;
}

function toggleMontagem(group, id) {
  const montagem = getTempMontagem();
  if (!montagem.tipo) return;

  const alertBox = document.getElementById("montagemAlert");
  if (alertBox) alertBox.textContent = "";

  const max = LIMITES[montagem.tipo][group];
  if (max === 0) return;

  const arr = montagem[group] || [];

  if (arr.includes(id)) {
    montagem[group] = arr.filter(item => item !== id);
    saveTempMontagem(montagem);
    renderMontagemPage();
    return;
  }

  if (arr.length >= max) {
    if (alertBox) {
      alertBox.textContent = `Você só pode escolher até ${max} opção(ões) em ${group}.`;
    }
    return;
  }

  montagem[group].push(id);
  saveTempMontagem(montagem);
  renderMontagemPage();
}

function renderMontagemPage() {
  const montagem = getTempMontagem();
  const title = document.getElementById("tipoPastelNome");
  const resumo = document.getElementById("montagemResumo");

  if (!title || !resumo) return;

  if (!montagem.tipo) {
    title.textContent = "Selecione o tipo";
    resumo.innerHTML = `<div class="empty-text">Escolha primeiro o tipo do pastel.</div>`;
    return;
  }

  const base = BASE_PASTEIS[montagem.tipo];
  const extra = getMontagemExtra(montagem);
  const total = Number(base.preco) + Number(extra);
  const limites = LIMITES[montagem.tipo];

  title.textContent = `${base.nome} • ${money(total)}`;

  resumo.innerHTML = `
    <div class="panel-title">${base.nome}</div>
    <div class="panel-subtitle">
      Sabor: ${montagem.sabor.length ? montagem.sabor.map(id => getOptionName("sabor", id)).join(", ") : "nenhum"}<br>
      Recheio: ${limites.recheio === 0 ? "não se aplica" : (montagem.recheio.length ? montagem.recheio.map(id => getOptionName("recheio", id)).join(", ") : "nenhum")}<br>
      Mix: ${limites.mix === 0 ? "não se aplica" : (montagem.mix.length ? montagem.mix.map(id => getOptionName("mix", id)).join(", ") : "nenhum")}<br>
      Valor atual: <span class="ok-text">${money(total)}</span>
    </div>
  `;

  ["sabor", "recheio", "mix"].forEach(group => {
    const wrap = document.getElementById(group + "Options");
    const info = document.getElementById(group + "Info");
    if (!wrap) return;

    const max = limites[group];
    const selected = montagem[group];

    if (info) {
      info.textContent = max === 0
        ? "Não disponível para este tipo."
        : `Você pode escolher de 0 até ${max} opção(ões). Selecionados: ${selected.length}`;
    }

    wrap.querySelectorAll(".option-chip").forEach(btn => {
      const optionId = btn.dataset.optionId;
      btn.classList.remove("active", "disabled");

      if (max === 0) {
        btn.classList.add("disabled");
        return;
      }

      if (selected.includes(optionId)) {
        btn.classList.add("active");
      } else if (selected.length >= max) {
        btn.classList.add("disabled");
      }
    });
  });
}

function openMissingModal(messages) {
  const modal = document.getElementById("confirmModal");
  const text = document.getElementById("confirmModalText");

  if (!modal || !text) return;

  text.innerHTML = messages.map(msg => escapeHtml(msg)).join("<br><br>");
  modal.classList.add("show");
}

function closeMissingModal() {
  const modal = document.getElementById("confirmModal");
  if (modal) modal.classList.remove("show");
}

function addMountedPastelAndContinue() {
  const montagem = getTempMontagem();
  const alertBox = document.getElementById("montagemAlert");
  if (alertBox) alertBox.textContent = "";

  if (!montagem.tipo) {
    if (alertBox) alertBox.textContent = "Selecione o tipo do pastel.";
    return;
  }

  const lim = LIMITES[montagem.tipo];
  const missing = [];

  if (lim.sabor > 0 && montagem.sabor.length === 0) {
    missing.push("Tem certeza que não deseja incluir mais algum sabor?");
  }
  if (lim.recheio > 0 && montagem.recheio.length === 0) {
    missing.push("Tem certeza que não deseja incluir mais algum recheio?");
  }
  if (lim.mix > 0 && montagem.mix.length === 0) {
    missing.push("Tem certeza que não deseja incluir mais algum mix?");
  }

  if (missing.length) {
    openMissingModal(missing);
    return;
  }

  finalizeMountedPastel();
}

function continueWithoutMoreOptions() {
  closeMissingModal();
  finalizeMountedPastel();
}

function finalizeMountedPastel() {
  const montagem = getTempMontagem();
  const base = BASE_PASTEIS[montagem.tipo];
  const extra = getMontagemExtra(montagem);
  const price = Number(base.preco) + Number(extra);

  const details = [];
  if (montagem.sabor.length) details.push("Sabor: " + montagem.sabor.map(id => getOptionName("sabor", id)).join(", "));
  if (montagem.recheio.length) details.push("Recheio: " + montagem.recheio.map(id => getOptionName("recheio", id)).join(", "));
  if (montagem.mix.length) details.push("Mix: " + montagem.mix.map(id => getOptionName("mix", id)).join(", "));

  const name = details.length
    ? `${base.nome} (${details.join(" | ")})`
    : `${base.nome} (sem adicionais)`;

  const key = "montado_" + Date.now();
  addQty(key, name, price);

  localStorage.removeItem(TEMP_MONTAGEM_KEY);
  window.location.href = "acompanhamentos.html";
}

function setFritasExtra(extra) {
  const store = getStore();
  store.acompanhamentos.fritasCarneSolExtra = extra;
  saveStore(store);
}

function renderFritasExtra() {
  const wrap = document.getElementById("fritasExtraWrap");
  if (!wrap) return;

  const qty = getQty("comp-fritas-carne-sol");
  const store = getStore();
  const extra = store.acompanhamentos.fritasCarneSolExtra;

  if (qty >= 1) {
    wrap.style.display = "block";

    document.querySelectorAll("[data-fritas-extra]").forEach(btn => {
      btn.classList.remove("active");
    });

    if (extra) {
      const selected = document.querySelector(`[data-fritas-extra="${extra}"]`);
      if (selected) selected.classList.add("active");
    }
  } else {
    wrap.style.display = "none";

    if (store.acompanhamentos.fritasCarneSolExtra) {
      store.acompanhamentos.fritasCarneSolExtra = "";
      saveStore(store);
    }
  }
}

function renderResumo() {
  const wrap = document.getElementById("summaryItems");
  if (!wrap) return;

  const store = getStore();

  if (!store.items.length) {
    wrap.innerHTML = `<div class="summary-box"><div class="empty-text">Seu pedido ainda está vazio.</div></div>`;
    return;
  }

  let html = `<div class="summary-box">`;

  store.items.forEach(item => {
    html += `
      <div class="summary-line">
        <span>${escapeHtml(item.qty + "x " + item.name)}</span>
        <strong>${money(Number(item.qty) * Number(item.price))}</strong>
      </div>
    `;
  });

  if (store.acompanhamentos.fritasCarneSolExtra) {
    html += `
      <div class="summary-line">
        <span>Adicional fritas carne de sol</span>
        <strong>${escapeHtml(store.acompanhamentos.fritasCarneSolExtra)}</strong>
      </div>
    `;
  }

  html += `
      <div class="summary-total">
        <span>Total</span>
        <span>${money(getTotalValue())}</span>
      </div>
    </div>
  `;

  wrap.innerHTML = html;
}

function saveDeliveryAndContinue() {
  const nome = document.getElementById("nome")?.value.trim() || "";
  const endereco = document.getElementById("endereco")?.value.trim() || "";
  const referencia = document.getElementById("referencia")?.value.trim() || "";
  const alertBox = document.getElementById("deliveryAlert");

  if (alertBox) alertBox.textContent = "";

  if (!nome || !endereco) {
    if (alertBox) alertBox.textContent = "Preencha nome e endereço.";
    return;
  }

  const store = getStore();
  store.delivery = { nome, endereco, referencia };
  saveStore(store);
  window.location.href = "pagamento.html";
}

function loadDeliveryFields() {
  const store = getStore();

  const nome = document.getElementById("nome");
  const endereco = document.getElementById("endereco");
  const referencia = document.getElementById("referencia");

  if (nome) nome.value = store.delivery.nome || "";
  if (endereco) endereco.value = store.delivery.endereco || "";
  if (referencia) referencia.value = store.delivery.referencia || "";
}

function setPayment(method) {
  const store = getStore();
  store.payment = method;
  saveStore(store);

  document.querySelectorAll(".pay-option").forEach(btn => btn.classList.remove("active"));

  const selected = document.querySelector(`[data-pay="${method}"]`);
  if (selected) selected.classList.add("active");
}

function renderPaymentSummary() {
  const wrap = document.getElementById("paymentSummary");
  if (!wrap) return;

  const store = getStore();

  if (!store.items.length) {
    wrap.innerHTML = `<div class="summary-box"><div class="empty-text">Seu pedido está vazio.</div></div>`;
    return;
  }

  let html = `<div class="summary-box">`;

  store.items.forEach(item => {
    html += `
      <div class="summary-line">
        <span>${escapeHtml(item.qty + "x " + item.name)}</span>
        <strong>${money(Number(item.qty) * Number(item.price))}</strong>
      </div>
    `;
  });

  if (store.acompanhamentos.fritasCarneSolExtra) {
    html += `
      <div class="summary-line">
        <span>Adicional fritas carne de sol</span>
        <strong>${escapeHtml(store.acompanhamentos.fritasCarneSolExtra)}</strong>
      </div>
    `;
  }

  html += `
      <div class="summary-total">
        <span>Total</span>
        <span>${money(getTotalValue())}</span>
      </div>
    </div>
  `;

  wrap.innerHTML = html;

  if (store.payment) {
    document.querySelectorAll(".pay-option").forEach(btn => btn.classList.remove("active"));
    const selected = document.querySelector(`[data-pay="${store.payment}"]`);
    if (selected) selected.classList.add("active");
  }
}

function finishOrder() {
  const store = getStore();
  const alertBox = document.getElementById("paymentAlert");

  if (alertBox) alertBox.textContent = "";

  if (!store.delivery.nome || !store.delivery.endereco) {
    if (alertBox) alertBox.textContent = "Dados de entrega não encontrados.";
    return;
  }

  if (!store.payment) {
    if (alertBox) alertBox.textContent = "Selecione a forma de pagamento.";
    return;
  }

  let msg = `OXENTE PASTEL
------------------------------
RELATÓRIO DO PEDIDO
`;

  store.items.forEach(item => {
    msg += `${item.qty}x ${item.name} - ${money(Number(item.qty) * Number(item.price))}
`;
  });

  if (store.acompanhamentos.fritasCarneSolExtra) {
    msg += `Adicional fritas carne de sol: ${store.acompanhamentos.fritasCarneSolExtra}
`;
  }

  msg += `------------------------------
TOTAL: ${money(getTotalValue())}
------------------------------
Nome: ${store.delivery.nome}
Endereço: ${store.delivery.endereco}
Ref: ${store.delivery.referencia || "-"}
Pagamento: ${store.payment}
------------------------------
Agradecemos pela preferência!`;

  window.location.href = `https://wa.me/5588998650795?text=${encodeURIComponent(msg)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body?.dataset?.page || "";

  setProgress(page);
  updateCartBadge();
  renderQtyControls();
  renderCartDrawer();
  renderMontagemPage();
  renderResumo();
  loadDeliveryFields();
  renderPaymentSummary();
  renderFritasExtra();
});
