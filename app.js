const CART="oxente_cart";

function getCart(){
return JSON.parse(localStorage.getItem(CART)||"[]")
}

function saveCart(c){
localStorage.setItem(CART,JSON.stringify(c))
updateCart()
}

function addItem(name,price){
let c=getCart()
let f=c.find(i=>i.name==name)
if(f)f.q++
else c.push({name,price,q:1})
saveCart(c)
}

function removeItem(name){
let c=getCart()
let f=c.find(i=>i.name==name)
if(!f)return
f.q--
if(f.q<=0)c=c.filter(i=>i.name!=name)
saveCart(c)
}

function updateCart(){
let c=getCart()
let total=0
let count=0
c.forEach(i=>{
total+=i.price*i.q
count+=i.q
})
document.querySelectorAll(".cart-count").forEach(e=>e.innerText=count)
document.querySelectorAll(".cart-total").forEach(e=>e.innerText="R$ "+total.toFixed(2))
}

function progress(p){
document.querySelectorAll(".progress-fill").forEach(e=>{
e.style.width=p+"%"
})
}

function confirmMontagem(msg,cb){
let m=document.getElementById("modal")
document.getElementById("modalText").innerText=msg
m.style.display="flex"
window.confirmCb=cb
}

function modalContinue(){
document.getElementById("modal").style.display="none"
if(window.confirmCb)window.confirmCb()
}

function modalBack(){
document.getElementById("modal").style.display="none"
}

document.addEventListener("DOMContentLoaded",updateCart)
