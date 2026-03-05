const STORAGE_KEY = "oxente_pedido_v1";

function getPedido(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"items":[]}');
}

function savePedido(pedido){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pedido));
  updateCartUI();
}

function addItem(id, nome, preco){
  const pedido = getPedido();
  const existente = pedido.items.find(i => i.id === id);

  if(existente){
    existente.qtd += 1;
  }else{
    pedido.items.push({ id, nome, preco, qtd: 1 });
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
  renderResumo();
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

function formatMoney(v){
  return "R$ " + v.toFixed(2).replace(".", ",");
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

function renderResumo(){
  const wrap = document.getElementById("resumoPedido");
  if(!wrap) return;

  const pedido = getPedido();

  if(!pedido.items.length){
    wrap.innerHTML = `
      <div class="resume-box">
        <div class="subtitle" style="margin-bottom:0;">Seu pedido ainda está vazio.</div>
      </div>
    `;
    updateCartUI();
    return;
  }

  let html = `<div class="resume-box">`;

  pedido.items.forEach(item => {
    html += `
      <div class="resume-line">
        <span>${item.qtd}x ${item.nome}</span>
        <strong>${formatMoney(item.preco * item.qtd)}</strong>
      </div>
    `;
  });

  html += `
      <div class="resume-total">
        <span>Total</span>
        <span>${formatMoney(getTotalValor())}</span>
      </div>
    </div>
  `;

  wrap.innerHTML = html;
  updateCartUI();
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  renderPageQuantities();
  renderResumo();
});
