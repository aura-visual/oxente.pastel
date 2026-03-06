const CART="oxente_cart";

function cart(){
return JSON.parse(localStorage.getItem(CART)||"[]")
}

function save(c){
localStorage.setItem(CART,JSON.stringify(c))
renderCart()
}

function add(name,price){

let c=cart()

let f=c.find(i=>i.name==name)

if(f)f.q++
else c.push({name,price,q:1})

save(c)

}

function remove(name){

let c=cart()

let f=c.find(i=>i.name==name)

if(!f)return

f.q--

if(f.q<=0)
c=c.filter(i=>i.name!=name)

save(c)

}

function renderCart(){

let c=cart()

let el=document.getElementById("cartItems")

if(!el)return

let html=""

let total=0

c.forEach(i=>{

total+=i.price*i.q

html+=`

<div class="item">
<div>${i.name}</div>

<div class="qty">
<button onclick="remove('${i.name}')">-</button>
${i.q}
<button onclick="add('${i.name}',${i.price})">+</button>
</div>

</div>

`

})

html+=`<b>Total R$ ${total.toFixed(2)}</b>`

el.innerHTML=html

}

function openCart(){
document.getElementById("cart").style.display="block"
renderCart()
}

function closeCart(){
document.getElementById("cart").style.display="none"
}
