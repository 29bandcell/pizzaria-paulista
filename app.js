const STORE = {
  products: "paulista_products_v1",
  orders: "paulista_orders_v1",
  cart: "paulista_cart_v1",
  categories: "paulista_categories_v1",
  owner: "paulista_owner_ok_v1",
  internal: "paulista_internal_ok_v1"
};
const DB_TABLES = {
  products: "paulista_products",
  orders: "paulista_orders",
  categories: "paulista_categories"
};
const OWNER_PASSWORD = "Paulista@2026";
const INTERNAL_PASSWORD = "Paulista@2026";
const PIX_KEY = "02987757352";
const PIX_NAME = "Gabriel Nogueira de Oliveira - Pag Seguro";
const deliveryFees = {
  "Localidade Lagedo": 6,
  "Itaueira": 12,
  "Patos": 20,
  "Bastiões": 6,
  "Aruaru (centro)": 3,
  "Várzea da Jurema": 5
};
const DEFAULT_CATEGORIES = ["Pizzas Tradicionais", "Pizzas Premium", "Pizzas Doces", "Esfihas Salgadas", "Esfihas Doces", "Salgado", "Beirutes", "Calzones", "Bebidas"];
let categories = loadLocalCategories();
let cart = [];
let activeCategory = categories[0];
let ownerPeriod = "day";
let ownerFilters = { payment: "all", origin: "all", weekday: "all" };
let publicOrderingOpen = true;
let supabaseClient = null;
let supabaseReady = false;
let remoteSyncing = false;

const money = value => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const page = document.body.dataset.page;

function seedProducts() {
  if (localStorage.getItem(STORE.products)) return;
  const p = [];
  const add = (name, category, desc, price, options = {}) => p.push({
    id: uid("prod"),
    name,
    category,
    desc,
    price,
    sizes: options.sizes || null,
    isPizza: !!options.isPizza,
    soldOut: false
  });
  const trad = { media: 28, grande: 32 };
  const premium = { media: 30, grande: 34 };
  [
    ["Calabresa", "Mussarela, calabresa e cebola"],
    ["Bacon", "Mussarela e bacon"],
    ["Mussarela", "Mussarela"],
    ["Frango Catupiry", "Mussarela, frango e catupiry"],
    ["Portuguesa", "Mussarela, presunto, ovo e cebola"],
    ["Dois Queijos", "Mussarela e catupiry"],
    ["Três Queijos", "Mussarela, catupiry e cheddar"],
    ["Mista", "Mussarela e presunto"],
    ["Frango Especial", "Mussarela, frango e cheddar"]
  ].forEach(([n, d]) => add(n, "Pizzas Tradicionais", d, 28, { sizes: trad, isPizza: true }));
  [
    ["A Moda da Casa", "Mussarela, frango, calabresa, bacon e catupiry"],
    ["Paulista", "Mussarela, calabresa, carne de sol e bacon"],
    ["Strogonoff", "Mussarela, frango, creme de leite e batata palha"],
    ["Calabresa Especial", "Mussarela, calabresa, presunto e catupiry"],
    ["Baiana", "Mussarela, calabresa, ovo, molho de pimenta e cebola"],
    ["Lombo", "Mussarela e lombo"],
    ["Lombinho", "Mussarela, lombo e bacon"],
    ["Pepperoni", "Mussarela, pepperoni e catupiry"],
    ["Nordestina", "Mussarela, carne de sol e cebola"],
    ["Marguerita", "Mussarela, manjericão e tomate"],
    ["Sabor do Cliente", "Pode adicionar 3 itens"]
  ].forEach(([n, d]) => add(n, "Pizzas Premium", d, 30, { sizes: premium, isPizza: true }));
  ["Ouro Branco", "Romeu e Julieta", "Brigadeiro", "Chocolate Branco", "Confete", "Chocomista"].forEach(n => {
    const desc = {
      "Ouro Branco": "Chocolate ao leite e Ouro Branco",
      "Romeu e Julieta": "Mussarela e goiabada",
      "Brigadeiro": "Chocolate ao leite e granulado",
      "Chocolate Branco": "Chocolate branco",
      "Confete": "Chocolate ao leite e disquete colorido",
      "Chocomista": "Chocolate ao leite e chocolate branco"
    }[n];
    add(n, "Pizzas Doces", desc, 30, { sizes: premium, isPizza: true });
  });
  [
    ["Carne", 3], ["Mussarela", 3], ["Bacon", 3], ["Frango com Catupiry", 3],
    ["Dois Queijos", 3], ["Calabresa", 3], ["Mista", 3], ["Catupiry", 3], ["Carne de Sol", 4]
  ].forEach(([n, v]) => add(n, "Esfihas Salgadas", "Esfiha salgada aberta", v));
  [["Brigadeiro", 4], ["Confete", 4], ["Prestigio", 4], ["Chocolate Branco", 4]]
    .forEach(([n, v]) => add(n, "Esfihas Doces", "Esfiha doce aberta", v));
  [
    ["A Moda da Casa", "Presunto, frango, calabresa, mussarela, catupiry, bacon e salada"],
    ["Bauru", "Presunto, mussarela e salada"],
    ["Calabresa", "Calabresa, presunto, mussarela e salada"],
    ["Frango Cheddar", "Frango, presunto, mussarela, cheddar e salada"],
    ["Frango Especial", "Frango, presunto, ovo, mussarela, catupiry, bacon e salada"],
    ["Lombo", "Lombo, presunto, mussarela, catupiry e salada"],
    ["Carne de Sol", "Carne de sol, presunto, mussarela, catupiry e salada"]
  ].forEach(([n, d]) => add(n, "Beirutes", d, 25));
  [
    ["A Moda da Casa", "Mussarela, frango, calabresa, bacon e catupiry"],
    ["Bauru", "Mussarela e presunto"],
    ["Calabresa", "Mussarela, calabresa e catupiry"],
    ["Bacon", "Mussarela e bacon"],
    ["Dois Queijos", "Mussarela e catupiry"],
    ["Calabresa Especial", "Mussarela, presunto, calabresa e catupiry"],
    ["Portuguesa", "Mussarela, presunto e ovo"],
    ["Frango Catupiry", "Mussarela, frango e catupiry"],
    ["Strogonoff", "Mussarela, frango, creme de leite e batata palha"],
    ["Lombo", "Mussarela, lombo, catupiry e bacon"],
    ["Nordestina", "Mussarela e carne de sol"],
    ["Mussarela", "Mussarela"],
    ["Brigadeiro", "Chocolate ao leite e granulado"]
  ].forEach(([n, d]) => add(n, "Calzones", d, 25));
  add("Coca Cola 1L", "Bebidas", "Refrigerante", 10);
  add("Guarana 1L", "Bebidas", "Refrigerante", 10);
  localStorage.setItem(STORE.products, JSON.stringify(p));
}

function getProducts() { seedProducts(); return JSON.parse(localStorage.getItem(STORE.products) || "[]"); }
function saveProducts(products) {
  localStorage.setItem(STORE.products, JSON.stringify(products));
  if (supabaseReady && !remoteSyncing) persistProducts(products);
}
function getOrders() { return JSON.parse(localStorage.getItem(STORE.orders) || "[]"); }
function saveOrders(orders) { localStorage.setItem(STORE.orders, JSON.stringify(orders)); }
function loadCart() { cart = JSON.parse(localStorage.getItem(STORE.cart) || "[]"); }
function saveCart() { localStorage.setItem(STORE.cart, JSON.stringify(cart)); }

function loadLocalCategories() {
  const saved = JSON.parse(localStorage.getItem(STORE.categories) || "[]");
  return mergeCategories(saved);
}

function mergeCategories(extra = []) {
  return [...new Set([...DEFAULT_CATEGORIES, ...extra.map(c => String(c || "").trim()).filter(Boolean)])];
}

function saveCategories(list) {
  categories = mergeCategories(list);
  localStorage.setItem(STORE.categories, JSON.stringify(categories));
}

function categoriesWithProducts() {
  return mergeCategories([...categories, ...getProducts().map(product => product.category)]);
}

async function initSupabase() {
  const browserClient = window.supabase?.createClient;
  if (!browserClient) return false;

  let config = window.PAULISTA_SUPABASE_CONFIG || null;
  if (!config && location.protocol.startsWith("http")) {
    try {
      const response = await fetch("/api/config", { cache: "no-store" });
      if (response.ok) config = await response.json();
    } catch {}
  }

  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return false;
  supabaseClient = browserClient(config.supabaseUrl, config.supabaseAnonKey);
  supabaseReady = true;
  return true;
}

function productToRow(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.desc || "",
    price: product.price || 0,
    stock: 9999,
    type: "product",
    active: !product.soldOut,
    sizes: product.sizes || null,
    is_pizza: !!product.isPizza,
    sold_out: !!product.soldOut
  };
}

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category || "Cardapio",
    desc: row.description || "",
    price: Number(row.price || 0),
    sizes: row.sizes || null,
    isPizza: !!row.is_pizza,
    soldOut: !!row.sold_out || row.active === false
  };
}

function isPaulistaProduct(product) {
  return categories.includes(product.category);
}

function resetLocalDefaultProducts() {
  localStorage.removeItem(STORE.products);
  seedProducts();
  return getProducts();
}

function orderToRow(order) {
  return {
    id: order.id,
    order_number: order.number || null,
    created_at: order.createdAt,
    source: order.source,
    customer: order.customer || {},
    items: order.items || [],
    subtotal: order.subtotal || 0,
    total: order.total || 0,
    payment: order.payment,
    change_for: order.changeFor || 0,
    notes: order.notes || "",
    printed: !!order.printed,
    printed_at: order.printedAt || null,
    status: order.status || "Novo"
  };
}

function rowToOrder(row) {
  return {
    id: row.id,
    number: Number(row.order_number || 0),
    createdAt: row.created_at,
    source: row.source,
    customer: row.customer || {},
    items: row.items || [],
    subtotal: Number(row.subtotal || 0),
    total: Number(row.total || 0),
    payment: row.payment,
    changeFor: Number(row.change_for || 0),
    notes: row.notes || "",
    printed: !!row.printed,
    printedAt: row.printed_at || null,
    status: row.status || "Novo"
  };
}

async function loadSupabaseData() {
  if (!supabaseReady) return;
  remoteSyncing = true;
  try {
    await loadRemoteCategories();
    const productsResult = await supabaseClient.from(DB_TABLES.products).select("*").order("category").order("name");
    if (!productsResult.error && productsResult.data?.length) {
      const remoteProducts = productsResult.data.map(rowToProduct);
      if (remoteProducts.length) {
        localStorage.setItem(STORE.products, JSON.stringify(remoteProducts));
      } else {
        const defaults = resetLocalDefaultProducts();
        await persistProducts(defaults);
      }
    } else if (!productsResult.error) {
      const defaults = resetLocalDefaultProducts();
      await persistProducts(defaults);
    } else {
      const localProducts = getProducts();
      if (!localProducts.length) resetLocalDefaultProducts();
    }

    await refreshOrdersFromSupabase();
  } catch (error) {
    console.warn("Supabase indisponivel, usando dados locais.", error);
  } finally {
    remoteSyncing = false;
  }
}

async function loadRemoteCategories() {
  if (!supabaseReady) return;
  const result = await supabaseClient.from(DB_TABLES.categories).select("*").order("display_order").order("name");
  if (!result.error && result.data?.length) {
    saveCategories(result.data.map(row => row.name));
  } else if (!result.error) {
    await persistCategories(categories);
  }
}

async function refreshOrdersFromSupabase() {
  if (!supabaseReady) return;
  const result = await supabaseClient.from(DB_TABLES.orders).select("*").order("created_at", { ascending: false });
  if (!result.error && result.data) localStorage.setItem(STORE.orders, JSON.stringify(result.data.map(rowToOrder)));
}

async function persistProducts(products) {
  if (!supabaseReady) return;
  await supabaseClient.from(DB_TABLES.products).upsert(products.map(productToRow), { onConflict: "id" });
}

async function deleteRemoteProduct(id) {
  if (!supabaseReady) return;
  await supabaseClient.from(DB_TABLES.products).delete().eq("id", id);
}

async function persistCategories(list) {
  if (!supabaseReady) return;
  const rows = mergeCategories(list).map((name, index) => ({ name, display_order: (index + 1) * 10 }));
  await supabaseClient.from(DB_TABLES.categories).upsert(rows, { onConflict: "name" });
}

async function persistOrder(order) {
  if (!supabaseReady) return;
  const result = await supabaseClient.from(DB_TABLES.orders).upsert(orderToRow(order), { onConflict: "id" }).select("*").single();
  if (!result.error && result.data) {
    const remoteOrder = rowToOrder(result.data);
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === remoteOrder.id);
    if (idx >= 0) orders[idx] = remoteOrder;
    saveOrders(orders);
  }
}

async function persistOrderUpdate(order) {
  if (!supabaseReady) return;
  await supabaseClient.from(DB_TABLES.orders).update(orderToRow(order)).eq("id", order.id);
}

function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2400);
}

function needsInternalAuth() {
  return page === "empresa" || page === "atendimento";
}

function isInternalAuthed() {
  return localStorage.getItem(STORE.internal) === "1";
}

function showInternalLogin() {
  document.body.classList.add("auth-locked");
  document.body.insertAdjacentHTML("afterbegin", `
    <section id="internalLogin" class="internal-login">
      <div class="panel">
        <h1>Acesso interno</h1>
        <p class="muted">Area reservada para a equipe da Paulista.</p>
        <label style="margin-top:12px">Senha
          <input id="internalPassword" type="password" autocomplete="current-password" placeholder="Digite a senha">
        </label>
        <div class="actions" style="margin-top:12px">
          <button class="btn primary" id="internalLoginButton">Entrar</button>
          <a class="btn ghost" href="publico.html">Voltar ao link publico</a>
        </div>
      </div>
    </section>`);

  const submit = () => {
    if (document.getElementById("internalPassword").value !== INTERNAL_PASSWORD) {
      toast("Senha incorreta");
      return;
    }
    localStorage.setItem(STORE.internal, "1");
    document.getElementById("internalLogin")?.remove();
    document.body.classList.remove("auth-locked");
    bootstrapDataThenStart();
  };

  document.getElementById("internalLoginButton")?.addEventListener("click", submit);
  document.getElementById("internalPassword")?.addEventListener("keydown", event => {
    if (event.key === "Enter") submit();
  });
  setTimeout(() => document.getElementById("internalPassword")?.focus(), 50);
}

function productPrice(product, size) {
  if (!product.sizes) return product.price;
  return product.sizes[size || "media"] || product.price;
}

function getPublicHoursStatus(now = new Date()) {
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const schedule = {
    2: { start: 15 * 60, end: 21 * 60 + 50 },
    3: { start: 15 * 60, end: 21 * 60 + 50 },
    4: { start: 15 * 60, end: 21 * 60 + 50 },
    5: { start: 15 * 60, end: 22 * 60 + 50 },
    6: { start: 15 * 60, end: 22 * 60 + 50 },
    0: { start: 15 * 60, end: 22 * 60 + 50 }
  };
  const today = schedule[day];
  const open = !!today && minutes >= today.start && minutes <= today.end;
  return {
    open,
    message: "Pedidos online disponiveis: terca a quinta das 15:00 as 21:50; sexta, sabado e domingo das 15:00 as 22:50."
  };
}

function initPublicHours() {
  if (page !== "publico") return;
  const banner = document.getElementById("hoursBanner");
  const status = getPublicHoursStatus();
  publicOrderingOpen = status.open;
  if (banner) {
    banner.textContent = status.open ? "" : status.message;
    banner.classList.toggle("hidden", status.open);
  }
}

function addToCart(productId, size = null, custom = null) {
  const product = getProducts().find(x => x.id === productId);
  if (!product || product.soldOut) return;
  const item = {
    id: uid("item"),
    productId: product.id,
    name: custom?.name || product.name,
    category: product.category,
    desc: custom?.desc || product.desc,
    size,
    qty: 1,
    price: custom?.price ?? productPrice(product, size)
  };
  cart.push(item);
  saveCart();
  renderCart();
  toast("Produto adicionado");
}

function addCustomPizza() {
  ensurePizzaDialog();
  renderCustomPizzaDialog();
  document.getElementById("pizzaDialog")?.showModal();
}

function ensurePizzaDialog() {
  if (document.getElementById("pizzaDialog")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <dialog id="pizzaDialog">
      <div class="modal-body">
        <h2>Montar pizza</h2>
        <p class="muted">Escolha ate 3 sabores. O valor sera o sabor de maior preco.</p>
        <div class="form-grid" style="margin-top:12px">
          <label>Tamanho
            <select id="customPizzaSize" onchange="updateCustomPizzaTotal()">
              <option value="media">Media</option>
              <option value="grande" selected>Grande</option>
            </select>
          </label>
          <label>Total
            <input id="customPizzaTotal" readonly>
          </label>
        </div>
        <div id="customPizzaFlavors" class="flavor-list"></div>
        <div class="actions">
          <button class="btn primary" onclick="confirmCustomPizza()">Adicionar pizza</button>
          <button class="btn ghost" onclick="closeCustomPizza()">Cancelar</button>
        </div>
      </div>
    </dialog>`);
}

function renderCustomPizzaDialog() {
  const flavors = getProducts().filter(p => p.isPizza && !p.soldOut);
  const el = document.getElementById("customPizzaFlavors");
  if (!el) return;
  el.innerHTML = flavors.map(p => `
    <label class="flavor-option">
      <input type="checkbox" value="${p.id}" onchange="limitCustomPizzaFlavors(this);updateCustomPizzaTotal()">
      <span><strong>${p.name}</strong><br><small>${p.category}</small></span>
      <span class="money" data-flavor-price="${p.id}"></span>
    </label>`).join("");
  updateCustomPizzaTotal();
}

function selectedPizzaFlavors() {
  const ids = [...document.querySelectorAll("#customPizzaFlavors input:checked")].map(input => input.value);
  const products = getProducts();
  return ids.map(id => products.find(p => p.id === id)).filter(Boolean);
}

function limitCustomPizzaFlavors(input) {
  const checked = document.querySelectorAll("#customPizzaFlavors input:checked");
  if (checked.length > 3) {
    input.checked = false;
    toast("Escolha no maximo 3 sabores");
  }
}

function updateCustomPizzaTotal() {
  const size = document.getElementById("customPizzaSize")?.value || "grande";
  const products = getProducts().filter(p => p.isPizza && !p.soldOut);
  products.forEach(p => {
    const priceEl = document.querySelector(`[data-flavor-price="${p.id}"]`);
    if (priceEl) priceEl.textContent = money(productPrice(p, size));
  });
  const selected = selectedPizzaFlavors();
  const total = selected.reduce((max, p) => Math.max(max, productPrice(p, size)), 0);
  const totalEl = document.getElementById("customPizzaTotal");
  if (totalEl) totalEl.value = selected.length ? money(total) : "Selecione os sabores";
}

function confirmCustomPizza() {
  const selected = selectedPizzaFlavors();
  if (!selected.length) return toast("Escolha pelo menos um sabor");
  const size = document.getElementById("customPizzaSize")?.value || "grande";
  const highest = selected.reduce((max, p) => Math.max(max, productPrice(p, size)), 0);
  const custom = {
    name: "Montar Pizza",
    desc: `Sabores: ${selected.map(p => p.name).join(", ")}. Valor pelo maior sabor.`,
    price: highest
  };
  const base = selected[0];
  addToCart(base.id, size, custom);
  closeCustomPizza();
}

function closeCustomPizza() {
  document.getElementById("pizzaDialog")?.close();
}

function renderMenu() {
  const products = getProducts();
  const visibleCategories = categoriesWithProducts();
  const tabs = document.getElementById("categoryTabs");
  const sections = document.getElementById("productSections");
  if (!tabs || !sections) return;
  if (!visibleCategories.includes(activeCategory)) activeCategory = visibleCategories[0];
  tabs.innerHTML = visibleCategories.map(cat => `<button class="tab ${cat === activeCategory ? "active" : ""}" data-cat="${cat}">${cat}</button>`).join("");
  tabs.querySelectorAll("[data-cat]").forEach(btn => btn.onclick = () => {
    activeCategory = btn.dataset.cat;
    renderMenu();
  });
  const cats = [activeCategory];
  sections.innerHTML = cats.map(cat => {
    const list = products.filter(p => p.category === cat);
    const customPizza = cat.startsWith("Pizzas") ? `
      <article class="card product">
        <h3>Montar Pizza</h3>
        <p>Escolha ate 3 sabores. O valor sera o do sabor de maior preco.</p>
        <div class="price">Por maior valor</div>
        <button class="btn primary" onclick="addCustomPizza()">Montar</button>
      </article>` : "";
    return `
      <div class="section-title"><h2>${cat}</h2></div>
      <div class="grid">${customPizza}${list.map(productCard).join("")}</div>`;
  }).join("");
}

function productCard(p) {
  const disabled = p.soldOut ? "disabled" : "";
  const classes = `card product ${p.soldOut ? "sold-out" : ""}`;
  const actions = p.sizes
    ? `<div class="actions">
        <button class="btn primary" ${disabled} onclick="addToCart('${p.id}','media')">Media ${money(p.sizes.media)}</button>
        <button class="btn" ${disabled} onclick="addToCart('${p.id}','grande')">Grande ${money(p.sizes.grande)}</button>
      </div>`
    : `<button class="btn primary" ${disabled} onclick="addToCart('${p.id}')">Adicionar ${money(p.price)}</button>`;
  return `
    <article class="${classes}">
      <h3>${p.name}</h3>
      <p>${p.desc || ""}</p>
      <div class="price">${p.sizes ? `${money(p.sizes.media)} / ${money(p.sizes.grande)}` : money(p.price)}</div>
      ${actions}
    </article>`;
}

function cartSubtotal() { return cart.reduce((sum, item) => sum + item.price * item.qty, 0); }
function renderCart() {
  const list = document.getElementById("cartList");
  if (!list) return;
  if (!cart.length) {
    list.innerHTML = `<p class="muted">Nenhum produto selecionado.</p>`;
  } else {
    list.innerHTML = cart.map(item => `
      <div class="cart-line">
        <div>
          <strong>${item.name}${item.size ? ` (${item.size})` : ""}</strong>
          <small>${item.desc || ""}</small>
          <small>${money(item.price)} cada</small>
        </div>
        <div class="qty">
          <button onclick="changeQty('${item.id}',-1)">-</button>
          <strong>${item.qty}</strong>
          <button onclick="changeQty('${item.id}',1)">+</button>
        </div>
        <button class="btn ghost" onclick="removeItem('${item.id}')">Excluir</button>
        <strong class="money">${money(item.price * item.qty)}</strong>
      </div>`).join("");
  }
  const form = document.getElementById("customerForm");
  if (form) renderCustomerForm(form);
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart();
  renderCart();
}
function removeItem(id) {
  cart = cart.filter(x => x.id !== id);
  saveCart();
  renderCart();
}

function renderCustomerForm(form) {
  const deliveryMode = document.getElementById("deliveryMode")?.value || "Entrega";
  const locality = document.getElementById("locality")?.value || Object.keys(deliveryFees)[0];
  const fee = deliveryMode === "Entrega" ? deliveryFees[locality] || 0 : 0;
  const payment = document.getElementById("payment")?.value || "Dinheiro";
  const keep = {
    customerName: document.getElementById("customerName")?.value || "",
    customerPhone: document.getElementById("customerPhone")?.value || "",
    address: document.getElementById("address")?.value || "",
    cashChange: document.getElementById("cashChange")?.value || "",
    notes: document.getElementById("notes")?.value || ""
  };
  form.innerHTML = `
    <div class="totals">
      <div class="total-row"><span>Produtos</span><strong>${money(cartSubtotal())}</strong></div>
      <div class="total-row"><span>Entrega</span><strong>${money(fee)}</strong></div>
      <div class="total-row grand"><span>Total</span><span>${money(cartSubtotal() + fee)}</span></div>
    </div>
    <div class="form-grid" style="margin-top:12px">
      <label>Nome <input id="customerName" required value="${escapeAttr(keep.customerName)}"></label>
      <label>WhatsApp <input id="customerPhone" inputmode="numeric" maxlength="15" placeholder="(85) 99999-9999" value="${escapeAttr(keep.customerPhone)}"></label>
      <label class="full">Endereco <textarea id="address" placeholder="Rua, numero, ponto de referencia">${escapeHtml(keep.address)}</textarea></label>
      <label>Tipo
        <select id="deliveryMode" onchange="renderCart()">
          <option ${deliveryMode === "Entrega" ? "selected" : ""}>Entrega</option>
          <option ${deliveryMode === "Retirada" ? "selected" : ""}>Retirada</option>
        </select>
      </label>
      <label class="${deliveryMode === "Entrega" ? "" : "hidden"}">Localidade
        <select id="locality" onchange="renderCart()">${Object.entries(deliveryFees).map(([k, v]) => `<option ${k === locality ? "selected" : ""} value="${k}">${k} - ${money(v)}</option>`).join("")}</select>
      </label>
      <label>Pagamento
        <select id="payment" onchange="renderCart()">
          <option ${payment === "Dinheiro" ? "selected" : ""}>Dinheiro</option>
          <option ${payment === "Pix" ? "selected" : ""}>Pix</option>
          <option ${payment === "Cartao de credito" ? "selected" : ""}>Cartao de credito</option>
        </select>
      </label>
      <label class="${payment === "Dinheiro" ? "" : "hidden"}">Troco para
        <input id="cashChange" type="number" min="0" step="0.01" placeholder="Ex: 100" value="${escapeAttr(keep.cashChange)}">
      </label>
      <div class="panel full ${payment === "Pix" ? "" : "hidden"}" style="box-shadow:none">
        <strong>PIX copiavel</strong>
        <p class="muted">${PIX_NAME}</p>
        <div class="actions"><input value="${PIX_KEY}" readonly id="pixKey"><button class="btn primary" onclick="copyPix()">Copiar chave</button></div>
      </div>
      <label class="full">Observacao <textarea id="notes" placeholder="Ex: sem cebola, sem borda">${escapeHtml(keep.notes)}</textarea></label>
      <button class="btn primary full" onclick="finishPublicOrder()">Finalizar pedido</button>
    </div>`;
  document.getElementById("customerPhone")?.addEventListener("input", phoneMask);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function phoneMask(event) {
  const nums = event.target.value.replace(/\D/g, "").slice(0, 11);
  event.target.value = nums.length > 10
    ? nums.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    : nums.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

async function copyPix() {
  try {
    await navigator.clipboard.writeText(PIX_KEY);
  } catch {
    const input = document.getElementById("pixKey");
    input.select();
    document.execCommand("copy");
  }
  toast("chave pix copiada");
}

function finishPublicOrder() {
  if (!publicOrderingOpen) return toast("Pedidos online fora do horario de atendimento");
  if (!cart.length) return toast("Escolha pelo menos um produto");
  const name = document.getElementById("customerName")?.value.trim();
  const phone = document.getElementById("customerPhone")?.value.trim();
  if (!name || phone.replace(/\D/g, "").length < 10) return toast("Preencha nome e WhatsApp valido");
  const mode = document.getElementById("deliveryMode").value;
  const locality = document.getElementById("locality")?.value || "";
  const fee = mode === "Entrega" ? deliveryFees[locality] || 0 : 0;
  const payment = document.getElementById("payment").value;
  const order = createOrder({
    source: "Link publico",
    customer: {
      name,
      phone,
      address: document.getElementById("address").value.trim(),
      mode,
      locality,
      fee
    },
    payment,
    changeFor: Number(document.getElementById("cashChange")?.value || 0),
    notes: document.getElementById("notes").value.trim()
  });
  cart = [];
  saveCart();
  renderCart();
  const receipt = document.getElementById("successReceipt");
  if (receipt) receipt.innerHTML = receiptHtml(order);
  document.getElementById("successDialog")?.showModal();
}
function closeSuccess() { document.getElementById("successDialog")?.close(); }

function createOrder(extra) {
  const existingNumbers = getOrders().map(o => Number(o.number || 0));
  const order = {
    id: uid("pedido"),
    number: Math.max(0, ...existingNumbers) + 1,
    createdAt: new Date().toISOString(),
    items: cart.map(x => ({ ...x })),
    subtotal: cartSubtotal(),
    total: cartSubtotal() + (extra.customer?.fee || 0),
    printed: false,
    status: "Novo",
    ...extra
  };
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  persistOrder(order);
  return order;
}

function isTableSource(source) {
  return /^Mesa\s+(10|[1-9])$/.test(String(source || ""));
}

function isOpenTableOrder(order) {
  return isTableSource(order.source) && order.status === "Aberto";
}

function appendToTableOrder(source, payment, notes) {
  const orders = getOrders();
  const open = orders.find(order => order.source === source && order.status === "Aberto");
  const newItems = cart.map(item => ({ ...item }));
  const addedSubtotal = cartSubtotal();

  if (!open) {
    return createOrder({
      source,
      customer: { name: source, mode: "Mesa", fee: 0 },
      payment,
      notes,
      status: "Aberto"
    });
  }

  open.items = [...open.items, ...newItems];
  open.subtotal = Number(open.subtotal || 0) + addedSubtotal;
  open.total = Number(open.total || 0) + addedSubtotal;
  open.payment = payment;
  open.notes = [open.notes, notes].filter(Boolean).join(" | ");
  open.printed = false;
  saveOrders(orders);
  persistOrderUpdate(open);
  return open;
}

function initCounter() {
  const origin = document.getElementById("saleOrigin");
  if (origin) {
    origin.innerHTML = [`Balcao`, ...Array.from({ length: 10 }, (_, i) => `Mesa ${i + 1}`)].map(x => `<option>${x}</option>`).join("");
  }
  document.getElementById("finishCounter")?.addEventListener("click", () => {
    if (!cart.length) return toast("Adicione produtos na comanda");
    const source = origin.value;
    const payment = document.getElementById("counterPayment").value;
    const notes = document.getElementById("counterNote").value.trim();
    if (isTableSource(source)) {
      appendToTableOrder(source, payment, notes);
    } else {
      createOrder({
        source,
        customer: { name: source, mode: "Local", fee: 0 },
        payment,
        notes
      });
    }
    cart = [];
    saveCart();
    document.getElementById("counterNote").value = "";
    renderCart();
    toast(isTableSource(source) ? `Comanda da ${source} atualizada` : "Venda enviada para a area da empresa");
  });
}

function initCompany() {
  document.querySelectorAll("[data-company-tab]").forEach(btn => btn.onclick = () => {
    document.querySelectorAll("[data-company-tab]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    ["orders", "menu", "links"].forEach(name => document.getElementById(`${name}Tab`).classList.toggle("hidden", name !== btn.dataset.companyTab));
    if (btn.dataset.companyTab === "menu") renderManageMenu();
    if (btn.dataset.companyTab === "links") renderLinks();
  });
  setupCategoryForm();
  setupProductForm();
  renderOrders();
  setInterval(renderOrders, 10000);
}

function setupCategoryForm() {
  const form = document.getElementById("categoryForm");
  if (!form) return;
  renderCategoryManage();
  form.addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById("newCategoryName");
    const name = input.value.trim();
    if (!name) return toast("Informe o nome da categoria");
    if (categoriesWithProducts().some(cat => cat.toLowerCase() === name.toLowerCase())) {
      input.value = "";
      return toast("Categoria ja existe");
    }
    saveCategories([...categories, name]);
    persistCategories(categories);
    input.value = "";
    setupProductCategoryOptions();
    renderCategoryManage();
    renderManageMenu();
    toast("Categoria adicionada");
  });
}

function setupProductCategoryOptions() {
  const category = document.getElementById("prodCategory");
  if (category) category.innerHTML = categoriesWithProducts().map(c => `<option>${c}</option>`).join("");
}

function renderCategoryManage() {
  const el = document.getElementById("categoryManage");
  if (!el) return;
  el.innerHTML = categoriesWithProducts().map(cat => `<span class="badge">${escapeHtml(cat)}</span>`).join("");
}

async function renderOrders() {
  const el = document.getElementById("ordersList");
  if (!el) return;
  await refreshOrdersFromSupabase();
  const orders = getOrders();
  el.innerHTML = orders.length ? orders.map(orderHtml).join("") : `<p class="muted">Nenhum pedido ainda.</p>`;
  const firstNew = orders.find(o => !o.printed && !isOpenTableOrder(o));
  if (firstNew) printOrder(firstNew.id, true);
}

function orderHtml(o) {
  const alert = o.payment === "Dinheiro" && o.changeFor ? `<span class="badge red">LEVAR TROCO ${money(o.changeFor)}</span>` :
    o.payment === "Cartao de credito" ? `<span class="badge red">LEVAR MAQUINETA</span>` : "";
  const phoneLink = whatsappLink(o.customer?.phone);
  const openTable = isOpenTableOrder(o);
  const statusBadge = openTable
    ? `<span class="badge blue">ABERTO</span>`
    : !o.printed ? `<span class="badge">NOVO</span>` : `<span class="badge green">Impresso</span>`;
  const primaryAction = openTable
    ? `<button class="btn primary" onclick="closeTableOrder('${o.id}')">Fechar comanda</button>`
    : `<button class="btn primary" onclick="printOrder('${o.id}')">Imprimir comanda</button>`;
  const itemsHtml = o.items.map(i => `
    <li>
      ${i.qty}x ${i.name}${i.size ? ` (${i.size})` : ""} - ${money(i.price * i.qty)}
      ${openTable ? `<button class="btn ghost mini-btn" onclick="removeTableItem('${o.id}','${i.id}')">Excluir</button>` : ""}
    </li>`).join("");
  return `
    <article class="card order">
      <div class="order-head">
        <div><strong>Pedido #${o.number}</strong><br><span class="muted">${new Date(o.createdAt).toLocaleString("pt-BR")} - ${o.source}</span></div>
        <div class="actions">${statusBadge}${alert}</div>
      </div>
      <p><strong>${o.customer?.name || ""}</strong> ${phoneLink}</p>
      <p class="muted">${o.customer?.mode || ""} ${o.customer?.locality ? `- ${o.customer.locality}` : ""} ${o.customer?.address ? `- ${o.customer.address}` : ""}</p>
      <ul class="order-items">${itemsHtml}</ul>
      ${o.notes ? `<p><strong>Obs:</strong> ${o.notes}</p>` : ""}
      <div class="actions">
        <strong>Total ${money(o.total)}</strong>
        ${primaryAction}
        ${openTable ? `<button class="btn ghost" onclick="printOrder('${o.id}')">Imprimir parcial</button>` : `<button class="btn ghost" onclick="markDone('${o.id}')">Concluir</button>`}
      </div>
    </article>`;
}

function removeTableItem(orderId, itemId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || !isOpenTableOrder(order)) return;

  const item = order.items.find(i => i.id === itemId);
  if (!item) return;
  if (!confirm(`Excluir ${item.name} da ${order.source}?`)) return;

  const removedTotal = Number(item.price || 0) * Number(item.qty || 1);
  order.items = order.items.filter(i => i.id !== itemId);
  order.subtotal = Math.max(0, Number(order.subtotal || 0) - removedTotal);
  order.total = Math.max(0, Number(order.total || 0) - removedTotal);
  order.printed = false;

  if (!order.items.length) {
    order.status = "Cancelado";
  }

  saveOrders(orders);
  persistOrderUpdate(order);
  renderOrders();
  toast("Produto removido da comanda");
}

function whatsappLink(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) return escapeHtml(phone || "");
  return `<a class="whatsapp-link" href="https://wa.me/55${digits}" target="_blank" rel="noopener">WhatsApp ${escapeHtml(phone)}</a>`;
}

function receiptHtml(o) {
  const warning = o.payment === "Dinheiro" && o.changeFor ? `<p><strong>LEVAR TROCO PARA ${money(o.changeFor)}</strong></p>` :
    o.payment === "Cartao de credito" ? `<p><strong>LEVAR MAQUINETA</strong></p>` : "";
  return `
    <div class="receipt">
      <h2>PAULISTA PIZZARIA</h2>
      <p><strong>Pedido #${o.number}</strong><br>${new Date(o.createdAt).toLocaleString("pt-BR")}<br>${o.source}</p>
      <hr>
      <p>${o.customer?.name || ""}<br>${o.customer?.phone || ""}<br>${o.customer?.mode || ""} ${o.customer?.locality || ""}<br>${o.customer?.address || ""}</p>
      <hr>
      ${o.items.map(i => `<p class="receipt-item"><strong>${i.qty}x ${i.name}${i.size ? ` (${i.size})` : ""}</strong><br>${money(i.price * i.qty)}</p>`).join("")}
      <hr>
      ${o.customer?.fee ? `<p>Entrega: ${money(o.customer.fee)}</p>` : ""}
      <p><strong>Total: ${money(o.total)}</strong></p>
      <p>Pagamento: ${o.payment}</p>
      ${warning}
      ${o.notes ? `<p>Obs: ${o.notes}</p>` : ""}
      <div class="receipt-end"></div>
    </div>`;
}

function printOrder(id, automatic = false) {
  const orders = getOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return;
  const area = document.getElementById("printArea");
  if (area) {
    area.innerHTML = receiptHtml(order);
    area.classList.remove("hidden");
  }
  order.printed = true;
  order.printedAt = new Date().toISOString();
  saveOrders(orders);
  persistOrderUpdate(order);
  setTimeout(() => window.print(), automatic ? 700 : 50);
  setTimeout(renderOrders, 900);
}

function closeTableOrder(id) {
  const orders = getOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return;
  order.status = "Fechado";
  order.printed = false;
  saveOrders(orders);
  persistOrderUpdate(order);
  printOrder(id);
}

function markDone(id) {
  const orders = getOrders();
  const order = orders.find(o => o.id === id);
  if (order) order.status = "Concluido";
  saveOrders(orders);
  if (order) persistOrderUpdate(order);
  renderOrders();
}

function setupProductForm() {
  setupProductCategoryOptions();
  document.getElementById("prodSizeMode")?.addEventListener("change", updateProductPriceFields);
  updateProductPriceFields();
  document.getElementById("clearProductForm")?.addEventListener("click", clearProductForm);
  document.getElementById("productForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const products = getProducts();
    const id = document.getElementById("editProductId").value;
    const sizeMode = document.getElementById("prodSizeMode").value;
    const singlePrice = Number(document.getElementById("prodPrice").value || 0);
    const mediumPrice = Number(document.getElementById("prodPriceM").value || 0);
    const largePrice = Number(document.getElementById("prodPriceG").value || 0);
    if (sizeMode === "single" && !singlePrice) return toast("Informe o preco unico");
    if (sizeMode === "pizza" && (!mediumPrice || !largePrice)) return toast("Informe os precos M e G");
    const data = {
      id: id || uid("prod"),
      name: document.getElementById("prodName").value.trim(),
      category: document.getElementById("prodCategory").value,
      desc: document.getElementById("prodDesc").value.trim(),
      price: sizeMode === "pizza" ? mediumPrice : singlePrice,
      sizes: sizeMode === "pizza" ? { media: mediumPrice, grande: largePrice } : null,
      isPizza: sizeMode === "pizza",
      soldOut: document.getElementById("prodSoldOut").checked
    };
    if (id) {
      const idx = products.findIndex(p => p.id === id);
      products[idx] = data;
    } else products.unshift(data);
    saveProducts(products);
    clearProductForm();
    renderManageMenu();
    toast("Produto salvo");
  });
}

function updateProductPriceFields() {
  const mode = document.getElementById("prodSizeMode")?.value || "single";
  document.getElementById("singlePriceBox")?.classList.toggle("hidden", mode !== "single");
  document.getElementById("mediumPriceBox")?.classList.toggle("hidden", mode !== "pizza");
  document.getElementById("largePriceBox")?.classList.toggle("hidden", mode !== "pizza");
}

function clearProductForm() {
  ["editProductId", "prodName", "prodDesc", "prodPrice", "prodPriceM", "prodPriceG"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("prodSoldOut").checked = false;
  document.getElementById("prodSizeMode").value = "single";
  updateProductPriceFields();
}

function renderManageMenu() {
  const el = document.getElementById("menuManage");
  if (!el) return;
  const products = getProducts();
  el.innerHTML = categoriesWithProducts().map(cat => `
    <div class="section-title"><h2>${cat}</h2></div>
    <div class="grid">${products.filter(p => p.category === cat).map(p => `
      <article class="card product ${p.soldOut ? "sold-out" : ""}">
        <h3>${p.name}</h3><p>${p.desc || ""}</p>
        <div class="price">${p.sizes ? `${money(p.sizes.media)} / ${money(p.sizes.grande)}` : money(p.price)}</div>
        <div class="actions">
          <button class="btn ghost" onclick="editProduct('${p.id}')">Editar</button>
          <button class="btn ${p.soldOut ? "ok" : "ghost"}" onclick="toggleSoldOut('${p.id}')">${p.soldOut ? "Disponivel" : "Esgotado"}</button>
          <button class="btn danger" onclick="deleteProduct('${p.id}')">Deletar</button>
        </div>
      </article>`).join("")}</div>`).join("");
}

function editProduct(id) {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  document.getElementById("editProductId").value = p.id;
  document.getElementById("prodName").value = p.name;
  document.getElementById("prodCategory").value = p.category;
  document.getElementById("prodDesc").value = p.desc || "";
  document.getElementById("prodPrice").value = p.sizes ? "" : p.price;
  document.getElementById("prodPriceM").value = p.sizes?.media || "";
  document.getElementById("prodPriceG").value = p.sizes?.grande || "";
  document.getElementById("prodSoldOut").checked = p.soldOut;
  document.getElementById("prodSizeMode").value = p.sizes ? "pizza" : "single";
  updateProductPriceFields();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function toggleSoldOut(id) {
  const products = getProducts();
  const p = products.find(x => x.id === id);
  if (p) p.soldOut = !p.soldOut;
  saveProducts(products);
  renderManageMenu();
}
function deleteProduct(id) {
  if (!confirm("Deletar este produto?")) return;
  saveProducts(getProducts().filter(p => p.id !== id));
  deleteRemoteProduct(id);
  renderManageMenu();
}

function renderLinks() {
  const el = document.getElementById("linksGrid");
  const base = `${location.origin}/`;
  const links = [
    ["Link Publico", `${base}publico.html`],
    ["Balcao e Mesas", `${base}atendimento.html`],
    ["Area da Empresa", `${base}empresa.html`]
  ];
  el.innerHTML = links.map(([name, href]) => `<article class="card product"><h3>${name}</h3><p class="muted">${href}</p><div class="actions"><a class="btn primary" href="${href}">Abrir</a><button class="btn ghost" onclick="copyText('${escapeAttr(href)}')">Copiar</button></div></article>`).join("");
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  toast("Link copiado");
}

function initOwner() {
  const ok = localStorage.getItem(STORE.owner) === "1";
  showOwner(ok);
  document.getElementById("ownerLogin")?.addEventListener("click", () => {
    if (document.getElementById("ownerPassword").value === OWNER_PASSWORD) {
      localStorage.setItem(STORE.owner, "1");
      showOwner(true);
    } else toast("Senha incorreta");
  });
  document.getElementById("ownerLogout")?.addEventListener("click", () => {
    localStorage.removeItem(STORE.owner);
    showOwner(false);
  });
  document.querySelectorAll("[data-period]").forEach(btn => btn.onclick = () => {
    ownerPeriod = btn.dataset.period;
    document.querySelectorAll("[data-period]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderOwner();
  });
  ["ownerPaymentFilter", "ownerOriginFilter", "ownerWeekdayFilter"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", readOwnerFilters);
  });
  document.getElementById("ownerClearFilters")?.addEventListener("click", () => {
    ownerFilters = { payment: "all", origin: "all", weekday: "all" };
    if (document.getElementById("ownerPaymentFilter")) document.getElementById("ownerPaymentFilter").value = "all";
    if (document.getElementById("ownerWeekdayFilter")) document.getElementById("ownerWeekdayFilter").value = "all";
    renderOwner();
  });
}

function readOwnerFilters() {
  ownerFilters = {
    payment: document.getElementById("ownerPaymentFilter")?.value || "all",
    origin: document.getElementById("ownerOriginFilter")?.value || "all",
    weekday: document.getElementById("ownerWeekdayFilter")?.value || "all"
  };
  renderOwner();
}

function showOwner(ok) {
  document.getElementById("loginOwner")?.classList.toggle("hidden", ok);
  document.getElementById("ownerDash")?.classList.toggle("hidden", !ok);
  if (ok) renderOwner();
}
function inPeriod(dateIso) {
  const d = new Date(dateIso);
  const now = new Date();
  if (ownerPeriod === "day") return d.toDateString() === now.toDateString();
  if (ownerPeriod === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return d >= start;
  }
  if (ownerPeriod === "all") return true;
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function ownerOriginOptions(orders) {
  const defaults = ["Link publico", "Balcao", ...Array.from({ length: 10 }, (_, i) => `Mesa ${i + 1}`)];
  const origins = [...new Set([...defaults, ...orders.map(o => o.source).filter(Boolean)])];
  return origins;
}

function syncOwnerOriginFilter(allOrders) {
  const select = document.getElementById("ownerOriginFilter");
  if (!select) return;
  const current = ownerFilters.origin || select.value || "all";
  select.innerHTML = `<option value="all">Todas</option>` + ownerOriginOptions(allOrders).map(origin => `<option value="${escapeAttr(origin)}">${escapeHtml(origin)}</option>`).join("");
  select.value = [...select.options].some(opt => opt.value === current) ? current : "all";
  ownerFilters.origin = select.value;
}

function applyOwnerFilters(orders) {
  return orders.filter(o => {
    const orderDay = String(new Date(o.createdAt).getDay());
    const paymentOk = ownerFilters.payment === "all" || o.payment === ownerFilters.payment;
    const originOk = ownerFilters.origin === "all" || o.source === ownerFilters.origin;
    const weekdayOk = ownerFilters.weekday === "all" || orderDay === ownerFilters.weekday;
    return inPeriod(o.createdAt) && paymentOk && originOk && weekdayOk;
  });
}

function weekdayName(dateIso) {
  return new Date(dateIso).toLocaleDateString("pt-BR", { weekday: "long" });
}

function renderOwner() {
  if (supabaseReady) refreshOrdersFromSupabase().then(() => renderOwnerFromLocal());
  else renderOwnerFromLocal();
}

function renderOwnerFromLocal() {
  const allOrders = getOrders();
  syncOwnerOriginFilter(allOrders);
  const orders = applyOwnerFilters(allOrders);
  const total = orders.reduce((s, o) => s + o.total, 0);
  const byPay = ["Pix", "Dinheiro", "Cartao de credito"].map(pay => [pay, orders.filter(o => o.payment === pay).reduce((s, o) => s + o.total, 0)]);
  document.getElementById("metrics").innerHTML = [
    ["Total", money(total)],
    ["Pedidos", orders.length],
    ...byPay.map(([p, v]) => [p, money(v)])
  ].map(([label, value]) => `<article class="card metric"><small>${label}</small><strong>${value}</strong></article>`).join("");
  document.getElementById("ownerTable").innerHTML = `
    <thead><tr><th>Pedido</th><th>Data</th><th>Dia</th><th>Origem</th><th>Pagamento</th><th>Total</th></tr></thead>
    <tbody>${orders.map(o => `<tr><td>#${o.number}</td><td>${new Date(o.createdAt).toLocaleString("pt-BR")}</td><td>${weekdayName(o.createdAt)}</td><td>${escapeHtml(o.source)}</td><td>${escapeHtml(o.payment)}</td><td>${money(o.total)}</td></tr>`).join("")}</tbody>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  seedProducts();
  loadCart();
  initPublicHours();
  if (needsInternalAuth() && !isInternalAuthed()) {
    showInternalLogin();
    return;
  }
  await bootstrapDataThenStart();
});

async function bootstrapDataThenStart() {
  await initSupabase();
  await loadSupabaseData();
  startAppAfterAuth();
}

function startAppAfterAuth() {
  if (page === "publico" || page === "atendimento") {
    renderMenu();
    renderCart();
  }
  if (page === "atendimento") initCounter();
  if (page === "empresa") initCompany();
  if (page === "proprietario") initOwner();
}
