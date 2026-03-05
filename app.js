// ====== OXENTE PASTEL - APP JS ======
const KEY = "oxente_cart_v1";
const CUSTOMER_KEY = "oxente_customer_v1";
const PAY_KEY = "oxente_pay_v1";

function money(n){
  return (Number(n)||0).toFixed(2).replace(".", ",");
}

function getCart(){
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

function setCart(cart){
  localStorage.setItem(KEY, JSON.stringify(cart));
  updateBadges();
}

function cartCount(){
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function cartTotal(){
  return getCart().reduce((sum, i) => sum + (i.price * i.qty), 0);
}

function updateBadges(){
  const count = cartCount();
  document.querySelectorAll("[data-cart-badge]").forEach(el => {
    el.textContent = String(count);
    el.style.display = count > 0 ? "inline-flex" : "none";
  });

  document.querySelectorAll("[data-cart-total]").forEach(el=>{
    el.textContent = "R$ " + money(cartTotal());
  });
}

function addItem(id, name, price){
  const cart = getCart();
  const idx = cart.findIndex(x => x.id === id);
  if(idx >= 0){
    cart[idx].qty += 1;
  }else{
    cart.push({id, name, price:Number(price), qty:1});
  }
  setCart(cart);
  toast("Adicionado ao carrinho ✅");
}

function incItem(id){
  const cart = getCart();
  const it = cart.find(x=>x.id===id);
  if(!it) return;
  it.qty += 1;
  setCart(cart);
  renderCart();
}

function decItem(id){
  const cart = getCart();
  const idx = cart.findIndex(x=>x.id===id);
  if(idx < 0) return;
  cart[idx].qty -= 1;
  if(cart[idx].qty <= 0) cart.splice(idx,1);
  setCart(cart);
  renderCart();
}

function clearCart(){
  localStorage.removeItem(KEY);
  updateBadges();
}

function toast(msg){
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position="fixed";
  t.style.left="50%";
  t.style.bottom="86px";
  t.style.transform="translateX(-50%)";
  t.style.padding="12px 14px";
  t.style.border="1px solid rgba(255,210,0,.35)";
  t.style.background="rgba(17,17,25,.92)";
  t.style.color="#fff";
  t.style.borderRadius="14px";
  t.style.zIndex="9999";
  t.style.boxShadow="0 18px 40px rgba(0,0,0,.45)";
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 1200);
}

function renderCart(){
  const box = document.getElementById("cartList");
  if(!box) return;

  const cart = getCart();
  if(cart.length === 0){
    box.innerHTML = `<div class="item"><p class="smallnote">Seu carrinho está vazio. Volte e adicione itens 🙂</p></div>`;
    updateBadges();
    return;
  }

  box.innerHTML = cart.map(i=>`
    <div class="item">
      <div class="item-top">
        <div>
          <h3>${i.name}</h3>
          <p>Preço unitário: <span class="price">R$ ${money(i.price)}</span></p>
        </div>
        <div class="price">R$ ${money(i.price * i.qty)}</div>
      </div>

      <div class="actions">
        <div class="stepper">
          <button onclick="decItem('${i.id}')">−</button>
          <div class="qty">${i.qty}</div>
          <button onclick="incItem('${i.id}')">+</button>
        </div>
        <button class="btn btn-ghost" onclick="decItem('${i.id}')">Remover 1</button>
      </div>
    </div>
  `).join("");

  updateBadges();
}

function saveCustomer(){
  const nome = (document.getElementById("nome")?.value || "").trim();
  const end = (document.getElementById("endereco")?.value || "").trim();
  const ref = (document.getElementById("ref")?.value || "").trim();

  localStorage.setItem(CUSTOMER_KEY, JSON.stringify({nome, end, ref}));
  updateBadges();
}

function loadCustomer(){
  const data = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}");
  if(document.getElementById("nome")) document.getElementById("nome").value = data.nome || "";
  if(document.getElementById("endereco")) document.getElementById("endereco").value = data.end || "";
  if(document.getElementById("ref")) document.getElementById("ref").value = data.ref || "";
}

function setPayment(method){
  localStorage.setItem(PAY_KEY, JSON.stringify({method}));
  document.querySelectorAll(".paybtn").forEach(b=>b.classList.remove("active"));
  const btn = document.querySelector(`[data-pay='${method}']`);
  if(btn) btn.classList.add("active");
}

function getPayment(){
  return JSON.parse(localStorage.getItem(PAY_KEY) || "{}");
}

function buildReceiptText(){
  const cart = getCart();
  const customer = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}");
  const pay = getPayment();

  // Formato para 80mm: linhas curtas, simples
  let lines = [];
  lines.push("OXENTE PASTEL");
  lines.push("------------------------------");
  lines.push("ENTREGA");
  lines.push(`Nome: ${customer.nome || "-"}`);
  lines.push(`End: ${customer.end || "-"}`);
  lines.push(`Ref: ${customer.ref || "-"}`);
  lines.push("------------------------------");
  lines.push("PEDIDO");

  cart.forEach(i=>{
    // Ex.: "2x Pastel Oxente....27,98"
    const totalItem = i.price * i.qty;
    const nome = i.name.length > 18 ? i.name.slice(0,18) + "…" : i.name;
    const dots = ".".repeat(Math.max(1, 26 - (String(i.qty).length + 2 + nome.length)));
    lines.push(`${i.qty}x ${nome}${dots}${money(totalItem)}`);
  });

  lines.push("------------------------------");
  lines.push(`TOTAL..................${money(cartTotal())}`);
  lines.push("------------------------------");
  lines.push(`PAGAMENTO: ${(pay.method || "-").toUpperCase()}`);
  lines.push("------------------------------");
  lines.push("Agradecemos pela preferência!");
  return lines.join("\n");
}

function renderPaymentSummary(){
  const box = document.getElementById("paySummary");
  if(!box) return;

  const cart = getCart();
  if(cart.length === 0){
    box.innerHTML = `<div class="item"><p class="smallnote">Sem itens no carrinho. Adicione itens antes de pagar.</p></div>`;
    updateBadges();
    return;
  }

  const lines = cart.map(i=>{
    const totalItem = i.price * i.qty;
    return `<div class="item-top"><div>${i.qty}x ${i.name}</div><div class="price">R$ ${money(totalItem)}</div></div>`;
  }).join(`<div class="hr"></div>`);

  box.innerHTML = `
    <div class="item">
      <h3>Relatório do pedido</h3>
      <div class="hr"></div>
      ${lines}
      <div class="hr"></div>
      <div class="item-top">
        <strong>Total</strong>
        <strong class="price">R$ ${money(cartTotal())}</strong>
      </div>
    </div>
  `;

  // marca pagamento salvo
  const pay = getPayment();
  if(pay.method){
    const btn = document.querySelector(`[data-pay='${pay.method}']`);
    if(btn) btn.classList.add("active");
  }

  updateBadges();
}

function finalizarWhatsApp(){
  const phone = "5588998650795"; // +55 88 99865-0795
  const text = buildReceiptText();
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.location.href = url;
}

document.addEventListener("DOMContentLoaded", updateBadges);