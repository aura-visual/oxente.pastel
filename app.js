const STORAGE_KEY = "oxente_pedido_v2";
const MONTAGEM_KEY = "oxente_montagem_v1";

const LIMITES = {
  oxente: { sabor: 1, recheio: 0, mix: 0 },
  arrochado: { sabor: 1, recheio: 2, mix: 1 },
  cabra_macho: { sabor: 1, recheio: 3, mix: 1 }
};

const OPCOES_MONTAGEM = {
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

function formatMoney(v){
  return "R$ " + Number(v).toFixed(2).replace(".", ",");
}

function getPedido(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"items":[]}');
}

function savePedido(pedido){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedido));
  updateCartUI();
}

function getMontagem(){
  return JSON.parse(localStorage.getItem(MONTAGEM_KEY) || '{"tipo":"","sabor":[],"recheio":[],"mix":[]}');
}

function saveMontagem(data){
  localStorage.setItem(MONTAGEM_KEY, JSON.stringify(data));
}

function resetMontagem(){
  localStorage.setItem(MONTAGEM_KEY, JSON.stringify({ tipo:"", sabor:[], recheio:[], mix:[] }));
}

function setTipoPastel(tipo){
  const montagem = { tipo, sabor:[], recheio:[], mix:[] };
  saveMontagem(montagem);
}

function addItem(id, nome, preco){
  const pedido = getPedido();
  const existente = pedido.items.find(i => i.id === id);

  if(existente){
    existente.qtd += 1;
  }else{
    pedido.items.push({ id, nome, preco:Number(preco), qtd:1 });
  }

  savePedido(pedido);
}

function changeQty(id, delta){
  const pedido = getPedido();
  const item = pedido.items.find(i => i.id === id);
  if(!item) return;

  item.qtd += delta;

  if(item.qtd <= 0){
    pedido.items = pedido.items.filter(i => i.id !== id);
  }

  savePedido(pedido);
  renderPageQuantities();
}

function getQtd(id){
  const pedido = getPedido();
  const item = pedido.items.find(i => i.id === id);
  return item ? item.qtd : 0;
}

function getTotalItens(){
  return getPedido().items.reduce((acc, item) => acc + item.qtd, 0);
}

function getTotalValor(){
  return getPedido().items.reduce((acc, item) => acc + (item.preco * item.qtd), 0);
}

function updateCartUI(){
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    el.textContent = getTotalItens();
  });

  document.querySelectorAll("[data-total]").forEach(el => {
    el.textContent = formatMoney(getTotalValor());
  });
}

function renderPageQuantities(){
  document.querySelectorAll("[data-item-id]").forEach(box => {
    const id = box.dataset.itemId;
    const value = box.querySelector(".qty-value");
    if(value){
      value.textContent = getQtd(id);
    }
  });
}

function getBasePastelInfo(tipo){
  if(tipo === "oxente"){
    return { nome: "Pastel Oxente", preco: 13.99 };
  }
  if(tipo === "arrochado"){
    return { nome: "Pastel Arrochado", preco: 17.99 };
  }
  if(tipo === "cabra_macho"){
    return { nome: "Pastel Cabra Macho", preco: 19.99 };
  }
  return { nome: "Pastel", preco: 0 };
}

function countSelected(arr){
  return Array.isArray(arr) ? arr.length : 0;
}

function toggleOpcao(categoria, opcaoId){
  const montagem = getMontagem();
  if(!montagem.tipo) return;

  const limites = LIMITES[montagem.tipo];
  const atual = montagem[categoria] || [];

  if(atual.includes(opcaoId)){
    montagem[categoria] = atual.filter(id => id !== opcaoId);
    saveMontagem(montagem);
    renderMontagem();
    return;
  }

  if(atual.length >= limites[categoria]){
    return;
  }

  montagem[categoria].push(opcaoId);
  saveMontagem(montagem);
  renderMontagem();
}

function getOpcaoNome(categoria, id){
  const item = OPCOES_MONTAGEM[categoria].find(op => op.id === id);
  return item ? item.nome : id;
}

function getExtraMontagem(montagem){
  let extra = 0;
  montagem.sabor.forEach(id => {
    const item = OPCOES_MONTAGEM.sabor.find(op => op.id === id);
    if(item && item.extra){
      extra += item.extra;
    }
  });
  return extra;
}

function montagemValida(){
  const montagem = getMontagem();
  if(!montagem.tipo) return false;

  const limites = LIMITES[montagem.tipo];

  const saborOk = montagem.sabor.length === limites.sabor;
  const recheioOk = montagem.recheio.length === limites.recheio;
  const mixOk = montagem.mix.length === limites.mix;

  return saborOk && recheioOk && mixOk;
}

function adicionarPastelMontado(){
  const montagem = getMontagem();
  if(!montagemValida()){
    const alertBox = document.getElementById("montagemAlert");
    if(alertBox){
      alertBox.textContent = "Complete as escolhas obrigatórias antes de continuar.";
    }
    return;
  }

  const base = getBasePastelInfo(montagem.tipo);
  const extra = getExtraMontagem(montagem);
  const precoFinal = base.preco + extra;

  const partes = [];
  if(montagem.sabor.length){
    partes.push("Sabor: " + montagem.sabor.map(id => getOpcaoNome("sabor", id)).join(", "));
  }
  if(montagem.recheio.length){
    partes.push("Recheio: " + montagem.recheio.map(id => getOpcaoNome("recheio", id)).join(", "));
  }
  if(montagem.mix.length){
    partes.push("Mix: " + montagem.mix.map(id => getOpcaoNome("mix", id)).join(", "));
  }

  const nomeFinal = `${base.nome} (${partes.join(" | ")})`;

  addItem(
    "montado_" + Date.now(),
    nomeFinal,
    precoFinal
  );

  resetMontagem();
  window.location.href = "viva-nordeste.html";
}

function renderMontagem(){
  const montagem = getMontagem();
  const tipoNomeEl = document.getElementById("tipoPastelNome");
  const resumoEl = document.getElementById("montagemResumo");
  const alertEl = document.getElementById("montagemAlert");

  if(alertEl){
    alertEl.textContent = "";
  }

  if(!montagem.tipo){
    if(tipoNomeEl) tipoNomeEl.textContent = "Nenhum tipo selecionado";
    return;
  }

  const base = getBasePastelInfo(montagem.tipo);
  const limites = LIMITES[montagem.tipo];
  const extra = getExtraMontagem(montagem);
  const total = base.preco + extra;

  if(tipoNomeEl){
    tipoNomeEl.textContent = base.nome + " • " + formatMoney(total);
  }

  if(resumoEl){
    resumoEl.innerHTML = `
      <h3>${base.nome}</h3>
      <p><strong>Sabor:</strong> ${montagem.sabor.length ? montagem.sabor.map(id => getOpcaoNome("sabor", id)).join(", ") : "Nenhum"}</p>
      <p><strong>Recheio:</strong> ${limites.recheio === 0 ? "Não se aplica" : (montagem.recheio.length ? montagem.recheio.map(id => getOpcaoNome("recheio", id)).join(", ") : "Nenhum")}</p>
      <p><strong>Mix:</strong> ${limites.mix === 0 ? "Não se aplica" : (montagem.mix.length ? montagem.mix.map(id => getOpcaoNome("mix", id)).join(", ") : "Nenhum")}</p>
      <p><strong>Valor atual:</strong> ${formatMoney(total)} ${extra > 0 ? "(inclui acréscimo de Carne de Sol)" : ""}</p>
    `;
  }

  ["sabor", "recheio", "mix"].forEach(categoria => {
    const container = document.getElementById(categoria + "Options");
    const info = document.getElementById(categoria + "Info");
    if(!container) return;

    const limite = limites[categoria];
    const selecionados = montagem[categoria];

    if(info){
      if(limite === 0){
        info.textContent = "Não disponível para este tipo de pastel.";
      }else{
        info.textContent = `Escolha ${limite} opção(ões). Selecionados: ${selecionados.length}/${limite}`;
      }
    }

    container.querySelectorAll(".option-chip").forEach(btn => {
      const id = btn.dataset.optionId;
      btn.classList.remove("active", "disabled");

      if(limite === 0){
        btn.classList.add("disabled");
        return;
      }

      if(selecionados.includes(id)){
        btn.classList.add("active");
      }else if(selecionados.length >= limite){
        btn.classList.add("disabled");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  renderPageQuantities();
  renderMontagem();
});
