const STORAGE_KEY = "oxente_fluxo_v5";
const TEMP_MONTAGEM_KEY = "oxente_temp_montagem_v5";
const CLIENT_KEY = "oxente_cliente_v2";
const PAYMENT_KEY = "oxente_pagamento_v2";
const ACCOMP_KEY = "oxente_acomp_v1";

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

function money(v){
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

function initialState(){
  return {
    items: [],
    flow: ""
  };
}

function getState(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(initialState()));
}

function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateUI();
}

function setFlow(flow){
  const state = getState();
  state.flow = flow;
  saveState(state);
}

function getFlow(){
  return getState().flow || "";
}

function goToFlow(flow, page){
  setFlow(flow);
  window.location.href = page;
}

function clearAll(){
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TEMP_MONTAGEM_KEY);
  localStorage.removeItem(CLIENT_KEY);
  localStorage.removeItem(PAYMENT_KEY);
  localStorage.removeItem(ACCOMP_KEY);
  updateUI();
}

function prevPageFor(page){
  const flow = getFlow();

  if(page === "pagamento") return "entrega.html";
  if(page === "entrega") return "resumo.html";

  if(flow === "combos"){
    if(page === "acompanhamentos") return "combos.html";
    if(page === "bebidas") return "acompanhamentos.html";
    if(page === "resumo") return "bebidas.html";
  }

  if(flow === "montagem"){
    if(page === "montagem-pastel") return "pasteis.html";
    if(page === "acompanhamentos") return "montagem-pastel.html";
    if(page === "bebidas") return "acompanhamentos.html";
    if(page === "resumo") return "bebidas.html";
  }

  if(flow === "nordeste"){
    if(page === "acompanhamentos") return "viva-nordeste.html";
    if(page === "bebidas") return "acompanhamentos.html";
    if(page === "resumo") return "bebidas.html";
  }

  return "index.html";
}

function progressByPage(page){
  const map = {
    "index": 8,
    "combos": 24,
    "pasteis": 22,
    "montagem-pastel": 38,
    "viva-nordeste": 24,
    "acompanhamentos": 58,
    "bebidas": 76,
    "resumo": 88,
    "entrega": 94,
    "pagamento": 100
  };
  return map[page] || 0;
}

function setProgress(page){
  const value = progressByPage(page);
  document.querySelectorAll("[data-progress-fill]").forEach(el => {
    el.style.width = value + "%";
  });
}

function addOrIncrease(id, nome, preco){
  const state = getState();
  const found = state.items.find(i => i.id === id);

  if(found){
    found.qtd += 1;
  } else {
    state.items.push({ id, nome, preco: Number(preco), qtd: 1 });
  }

  saveState(state);
}

function decreaseItem(id){
  const state = getState();
  const found = state.items.find(i => i.id === id);
  if(!found) return;

  found.qtd -= 1;

  if(found.qtd <= 0){
    state.items = state.items.filter(i => i.id !== id);
  }

  saveState(state);
  renderQuantityPages();
  renderResumo();
  renderFritasSubOption();
}

function getItemQty(id){
  const state = getState();
  const found = state.items.find(i => i.id === id);
  return found ? found.qtd : 0;
}

function totalItems(){
  return getState().items.reduce((acc, item) => acc + item.qtd, 0);
}

function totalValue(){
  return getState().items.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
}

function updateUI(){
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    el.textContent = totalItems();
  });

  document.querySelectorAll("[data-total]").forEach(el => {
    el.textContent = money(totalValue());
  });
}

function renderQuantityPages(){
  document.querySelectorAll("[data-item-id]").forEach(card => {
    const id = card.dataset.itemId;
    const value = card.querySelector(".qty-value");
    if(value){
      value.textContent = getItemQty(id);
    }
  });
}

function getTempMontagem(){
  return JSON.parse(localStorage.getItem(TEMP_MONTAGEM_KEY) || '{"tipo":"","sabor":[],"recheio":[],"mix":[]}');
}

function saveTempMontagem(data){
  localStorage.setItem(TEMP_MONTAGEM_KEY, JSON.stringify(data));
}

function selectPastelType(tipo){
  const data = {
    tipo,
    sabor: [],
    recheio: [],
    mix: []
  };

  saveTempMontagem(data);

  document.querySelectorAll(".select-card").forEach(card => {
    card.classList.remove("active");
  });

  const selected = document.querySelector(`[data-pastel-type="${tipo}"]`);
  if(selected) selected.classList.add("active");

  const btn = document.getElementById("btnContinuarPastel");
  if(btn){
    btn.classList.remove("btn-disabled");
    btn.href = "montagem-pastel.html";
  }
}

function getOptionName(group, id){
  const opt = OPCOES[group].find(o => o.id === id);
  return opt ? opt.nome : id;
}

function getMontagemExtra(data){
  let extra = 0;
  data.sabor.forEach(id => {
    const opt = OPCOES.sabor.find(o => o.id === id);
    if(opt && opt.extra) extra += opt.extra;
  });
  return extra;
}

function toggleMontagem(group, id){
  const data = getTempMontagem();
  if(!data.tipo) return;

  const limite = LIMITES[data.tipo][group];
  const arr = data[group] || [];

  if(limite === 0) return;

  if(arr.includes(id)){
    data[group] = arr.filter(item => item !== id);
    saveTempMontagem(data);
    renderMontagemPage();
    return;
  }

  if(arr.length >= limite){
    return;
  }

  data[group].push(id);
  saveTempMontagem(data);
  renderMontagemPage();
}

function renderMontagemPage(){
  const data = getTempMontagem();
  const resumo = document.getElementById("montagemResumo");
  const title = document.getElementById("tipoPastelNome");
  if(!resumo || !title) return;

  if(!data.tipo){
    title.textContent = "Selecione o tipo";
    resumo.innerHTML = `<p class="empty-text">Escolha primeiro o tipo de pastel.</p>`;
    return;
  }

  const base = BASE_PASTEIS[data.tipo];
  const lim = LIMITES[data.tipo];
  const extra = getMontagemExtra(data);
  const total = base.preco + extra;

  title.textContent = `${base.nome} • ${money(total)}`;

  resumo.innerHTML = `
    <div class="section-title">${base.nome}</div>
    <div class="section-subtitle">
      Sabor: ${data.sabor.length ? data.sabor.map(id => getOptionName("sabor", id)).join(", ") : "Nenhum"}<br>
      Recheio: ${lim.recheio === 0 ? "Não se aplica" : (data.recheio.length ? data.recheio.map(id => getOptionName("recheio", id)).join(", ") : "Nenhum")}<br>
      Mix: ${lim.mix === 0 ? "Não se aplica" : (data.mix.length ? data.mix.map(id => getOptionName("mix", id)).join(", ") : "Nenhum")}<br>
      Valor atual: <span class="ok-text">${money(total)}</span>
    </div>
  `;

  ["sabor","recheio","mix"].forEach(group => {
    const wrap = document.getElementById(group + "Options");
    const info = document.getElementById(group + "Info");
    if(!wrap) return;

    const limite = lim[group];
    const selected = data[group];

    if(info){
      info.textContent = limite === 0
        ? "Não disponível para este tipo."
        : `Você pode escolher até ${limite} opção(ões). Selecionados: ${selected.length}`;
    }

    wrap.querySelectorAll(".option-chip").forEach(btn => {
      const id = btn.dataset.optionId;
      btn.classList.remove("active","disabled");

      if(limite === 0){
        btn.classList.add("disabled");
        return;
      }

      if(selected.includes(id)){
        btn.classList.add("active");
      } else if(selected.length >= limite){
        btn.classList.add("disabled");
      }
    });
  });
}

function addMountedPastelAndContinue(){
  const data = getTempMontagem();
  const alert = document.getElementById("montagemAlert");
  if(alert) alert.textContent = "";

  if(!data.tipo){
    if(alert) alert.textContent = "Selecione um tipo de pastel.";
    return;
  }

  const missing = [];
  if(data.sabor.length === 0) missing.push("sabor");
  if(data.recheio.length === 0 && LIMITES[data.tipo].recheio > 0) missing.push("recheio");
  if(data.mix.length === 0 && LIMITES[data.tipo].mix > 0) missing.push("mix");

  if(missing.length > 0){
    openConfirmModal(missing);
    return;
  }

  finalizeMountedPastel();
}

function finalizeMountedPastel(){
  const data = getTempMontagem();
  const base = BASE_PASTEIS[data.tipo];
  const extra = getMontagemExtra(data);
  const price = base.preco + extra;

  const detalhes = [];
  if(data.sabor.length) detalhes.push("Sabor: " + data.sabor.map(id => getOptionName("sabor", id)).join(", "));
  if(data.recheio.length) detalhes.push("Recheio: " + data.recheio.map(id => getOptionName("recheio", id)).join(", "));
  if(data.mix.length) detalhes.push("Mix: " + data.mix.map(id => getOptionName("mix", id)).join(", "));

  const sufixo = detalhes.length ? ` (${detalhes.join(" | ")})` : " (sem adicionais)";
  const nome = `${base.nome}${sufixo}`;

  addOrIncrease("montado_" + Date.now(), nome, price);
  window.location.href = "acompanhamentos.html";
}

function openConfirmModal(missing){
  const modal = document.getElementById("confirmModal");
  const text = document.getElementById("confirmModalText");
  if(!modal || !text) return;

  const frases = [];
  if(missing.includes("recheio")) frases.push("Tem certeza que não deseja incluir mais algum recheio?");
  if(missing.includes("sabor")) frases.push("Tem certeza que não deseja incluir mais algum sabor?");
  if(missing.includes("mix")) frases.push("Tem certeza que não deseja incluir mais algum mix?");

  text.innerHTML = frases.join("<br><br>");
  modal.classList.add("show");
}

function closeConfirmModal(){
  const modal = document.getElementById("confirmModal");
  if(modal) modal.classList.remove("show");
}

function continueWithoutMoreOptions(){
  closeConfirmModal();
  finalizeMountedPastel();
}

function renderResumo(){
  const box = document.getElementById("summaryItems");
  if(!box) return;

  const items = getState().items;

  if(!items.length){
    box.innerHTML = `<div class="summary-box"><div class="empty-text">Seu pedido ainda está vazio.</div></div>`;
    return;
  }

  let html = `<div class="summary-box">`;

  items.forEach(item => {
    html += `
      <div class="summary-line">
        <span>${item.qtd}x ${item.nome}</span>
        <strong>${money(item.qtd * item.preco)}</strong>
      </div>
    `;
  });

  html += `
      <div class="summary-total">
        <span>Total</span>
        <span>${money(totalValue())}</span>
      </div>
    </div>
  `;

  box.innerHTML = html;
}

function saveCustomerData(){
  const nome = document.getElementById("nome")?.value.trim() || "";
  const endereco = document.getElementById("endereco")?.value.trim() || "";
  const referencia = document.getElementById("referencia")?.value.trim() || "";

  if(!nome || !endereco){
    const alert = document.getElementById("entregaAlert");
    if(alert) alert.textContent = "Preencha nome e endereço.";
    return false;
  }

  localStorage.setItem(CLIENT_KEY, JSON.stringify({
    nome,
    endereco,
    referencia
  }));

  return true;
}

function loadCustomerData(){
  const data = JSON.parse(localStorage.getItem(CLIENT_KEY) || "{}");

  const nome = document.getElementById("nome");
  const endereco = document.getElementById("endereco");
  const referencia = document.getElementById("referencia");

  if(nome) nome.value = data.nome || "";
  if(endereco) endereco.value = data.endereco || "";
  if(referencia) referencia.value = data.referencia || "";
}

function continueToPayment(){
  const ok = saveCustomerData();
  if(ok){
    window.location.href = "pagamento.html";
  }
}

function setPaymentMethod(method){
  localStorage.setItem(PAYMENT_KEY, JSON.stringify({ method }));

  document.querySelectorAll(".pay-option").forEach(btn => {
    btn.classList.remove("active");
  });

  const selected = document.querySelector(`[data-pay="${method}"]`);
  if(selected) selected.classList.add("active");
}

function loadPaymentMethod(){
  const data = JSON.parse(localStorage.getItem(PAYMENT_KEY) || "{}");
  if(!data.method) return;

  const selected = document.querySelector(`[data-pay="${data.method}"]`);
  if(selected) selected.classList.add("active");
}

function renderPaymentSummary(){
  const box = document.getElementById("paymentSummary");
  if(!box) return;

  const items = getState().items;

  if(!items.length){
    box.innerHTML = `<div class="summary-box"><div class="empty-text">Seu pedido está vazio.</div></div>`;
    return;
  }

  let html = `<div class="summary-box">`;

  items.forEach(item => {
    html += `
      <div class="summary-line">
        <span>${item.qtd}x ${item.nome}</span>
        <strong>${money(item.qtd * item.preco)}</strong>
      </div>
    `;
  });

  html += `
      <div class="summary-total">
        <span>Total</span>
        <span>${money(totalValue())}</span>
      </div>
    </div>
  `;

  box.innerHTML = html;
}

function finishOrderWhatsApp(){
  const items = getState().items;
  const customer = JSON.parse(localStorage.getItem(CLIENT_KEY) || "{}");
  const pay = JSON.parse(localStorage.getItem(PAYMENT_KEY) || "{}");
  const acomp = JSON.parse(localStorage.getItem(ACCOMP_KEY) || "{}");
  const alert = document.getElementById("paymentAlert");

  if(alert) alert.textContent = "";

  if(!customer.nome || !customer.endereco){
    if(alert) alert.textContent = "Dados de entrega não encontrados.";
    return;
  }

  if(!pay.method){
    if(alert) alert.textContent = "Selecione a forma de pagamento.";
    return;
  }

  let msg = "OXENTE PASTEL\n";
  msg += "------------------------------\n";
  msg += "RELATÓRIO DO PEDIDO\n";

  items.forEach(item => {
    msg += `${item.qtd}x ${item.nome} - ${money(item.qtd * item.preco)}\n`;
  });

  if(acomp.fritasCarneSolTipo){
    msg += `Adicional fritas carne de sol: ${acomp.fritasCarneSolTipo}\n`;
  }

  msg += "------------------------------\n";
  msg += `TOTAL: ${money(totalValue())}\n`;
  msg += "------------------------------\n";
  msg += `Nome: ${customer.nome}\n`;
  msg += `Endereço: ${customer.endereco}\n`;
  msg += `Ref: ${customer.referencia || "-"}\n`;
  msg += `Pagamento: ${pay.method}\n`;
  msg += "------------------------------\n";
  msg += "Agradecemos pela preferência!";

  const phone = "5588998650795";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.location.href = url;
}

function setFritasCarneSolTipo(tipo){
  const data = JSON.parse(localStorage.getItem(ACCOMP_KEY) || "{}");
  data.fritasCarneSolTipo = tipo;
  localStorage.setItem(ACCOMP_KEY, JSON.stringify(data));

  document.querySelectorAll("[data-fritas-extra]").forEach(btn => {
    btn.classList.remove("active");
  });

  const selected = document.querySelector(`[data-fritas-extra="${tipo}"]`);
  if(selected) selected.classList.add("active");
}

function renderFritasSubOption(){
  const wrap = document.getElementById("fritasCarneSolSuboption");
  if(!wrap) return;

  const qty = getItemQty("comp-fritas-carne-sol");
  const data = JSON.parse(localStorage.getItem(ACCOMP_KEY) || "{}");

  if(qty >= 1){
    wrap.style.display = "block";

    document.querySelectorAll("[data-fritas-extra]").forEach(btn => {
      btn.classList.remove("active");
    });

    if(data.fritasCarneSolTipo){
      const selected = document.querySelector(`[data-fritas-extra="${data.fritasCarneSolTipo}"]`);
      if(selected) selected.classList.add("active");
    }
  } else {
    wrap.style.display = "none";
    localStorage.removeItem(ACCOMP_KEY);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = document.body.dataset.page || "";
  setProgress(currentPage);
  updateUI();
  renderQuantityPages();
  renderMontagemPage();
  renderResumo();
  loadCustomerData();
  loadPaymentMethod();
  renderPaymentSummary();
  renderFritasSubOption();
});
