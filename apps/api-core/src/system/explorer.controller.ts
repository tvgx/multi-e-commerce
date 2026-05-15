import { Controller, Get, Header } from '@nestjs/common';

@Controller('explorer')
export class ExplorerController {
  @Get()
  @Header('Content-Type', 'text/html')
  getExplorer() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmniCommerce API Explorer</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #333; margin: 0; padding: 0; }
        header { background: #f8f9fa; border-bottom: 1px solid #dee2e6; padding: 20px 40px; }
        h1 { margin: 0; font-size: 24px; color: #1a1a1a; }
        .container { display: flex; max-width: 1400px; margin: 0 auto; padding: 20px; gap: 40px; }
        nav { width: 250px; flex-shrink: 0; }
        nav h3 { font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 15px; }
        nav ul { list-style: none; padding: 0; margin: 0; }
        nav li { padding: 10px 15px; cursor: pointer; border-radius: 6px; margin-bottom: 5px; font-weight: 500; font-size: 14px; }
        nav li:hover { background: #f0f0f0; }
        nav li.active { background: #e7f1ff; color: #0d6efd; }
        
        main { flex: 1; }
        .module-section { display: none; }
        .module-section.active { display: block; }
        
        .endpoint { border: 1px solid #eee; border-radius: 12px; margin-bottom: 20px; overflow: hidden; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .endpoint-header { padding: 15px 20px; display: flex; align-items: center; gap: 15px; background: #fafafa; border-bottom: 1px solid #eee; cursor: pointer; }
        .method { font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 4px; min-width: 60px; text-align: center; }
        .method.GET { background: #e6fcf5; color: #0ca678; }
        .method.POST { background: #e7f5ff; color: #1971c2; }
        .method.PUT { background: #fff4e6; color: #f76707; }
        .method.DELETE { background: #fff5f5; color: #e03131; }
        .path { font-family: monospace; font-size: 14px; color: #444; flex: 1; }
        .desc { font-size: 13px; color: #666; }
        
        .endpoint-body { padding: 20px; background: #fff; }
        .panels { display: grid; grid-cols: 1fr 1fr; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 1000px) { .panels { grid-template-columns: 1fr; } }
        
        h4 { margin: 0 0 10px 0; font-size: 12px; color: #999; text-transform: uppercase; }
        textarea { width: 100%; height: 150px; font-family: monospace; font-size: 12px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; resize: vertical; outline: none; }
        textarea:focus { border-color: #0d6efd; }
        
        .send-btn { background: #0d6efd; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 15px; }
        .send-btn:hover { background: #0b5ed7; }
        .send-btn:disabled { background: #ccc; cursor: not-allowed; }
        
        .response-area { background: #f8f9fa; border: 1px solid #eee; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 12px; white-space: pre-wrap; min-height: 150px; max-height: 400px; overflow-y: auto; }
        
        .inputs { background: #f8f9fa; padding: 15px 40px; border-bottom: 1px solid #eee; display: flex; gap: 20px; align-items: center; }
        .inputs label { font-size: 12px; font-weight: 700; color: #555; }
        .inputs input { padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; }
    </style>
</head>
<body>
    <header>
        <h1>OmniCommerce API Explorer</h1>
    </header>
    
    <div class="inputs">
        <div>
            <label>SHOP ID:</label>
            <input type="text" id="globalShopId" placeholder="x-shop-id">
        </div>
        <div>
            <label>ITEM ID:</label>
            <input type="text" id="globalItemId" placeholder=":id">
        </div>
    </div>

    <div class="container">
        <nav id="moduleList">
            <h3>Modules</h3>
            <ul id="navItems"></ul>
        </nav>
        
        <main id="content"></main>
    </div>

    <script>
        const API_MODULES = [
            {
                name: "Auth",
                desc: "Owner & Customer Authentication",
                endpoints: [
                    { method: "POST", path: "/api/auth/owner/sign-in", desc: "Owner Login", body: { email: "admin@example.com", password: "password" } },
                    { method: "POST", path: "/api/auth/owner/sign-up", desc: "Owner Register", body: { email: "new@example.com", password: "password", name: "New" } },
                    { method: "GET", path: "/api/auth/verify-session", desc: "Verify Session" }
                ]
            },
            {
                name: "Shops",
                desc: "Tenant & Shop Management",
                endpoints: [
                    { method: "POST", path: "/api/v1/tenants/register", desc: "Register Tenant", body: { shopName: "My Shop", email: "test@test.com", domain: "myshop", ownerName: "Owner" } },
                    { method: "GET", path: "/api/shops/my-shops", desc: "My Shops" },
                    { method: "GET", path: "/api/shops/system/all-shops", desc: "All Shops (Admin)" },
                    { method: "GET", path: "/api/shops/resolve/:id", desc: "Resolve Shop" },
                    { method: "GET", path: "/api/shops/:id", desc: "Get Shop Settings" },
                    { method: "PUT", path: "/api/shops/:id", desc: "Update Shop", body: { name: "New Name" } },
                    { method: "GET", path: "/api/shops/:id/onboarding", desc: "Onboarding Progress" }
                ]
            },
            {
                name: "Products",
                desc: "Catalog Management",
                endpoints: [
                    { method: "GET", path: "/api/products", desc: "List Products" },
                    { method: "POST", path: "/api/products", desc: "Create Product", body: { name: "Product 1", price: 100 } },
                    { method: "GET", path: "/api/products/:id", desc: "Get Product" },
                    { method: "PUT", path: "/api/products/:id", desc: "Update Product", body: { name: "Updated" } },
                    { method: "DELETE", path: "/api/products/:id", desc: "Delete Product" }
                ]
            },
            {
                name: "Collections",
                desc: "Category Management",
                endpoints: [
                    { method: "GET", path: "/api/collections", desc: "List Collections" },
                    { method: "POST", path: "/api/collections", desc: "Create Collection", body: { name: "Collection 1", slug: "c1" } }
                ]
            },
            {
                name: "Layouts",
                desc: "Zero-file Layout Engine",
                endpoints: [
                    { method: "GET", path: "/api/layouts/:id", desc: "Get Layout" },
                    { method: "PUT", path: "/api/layouts/:id", desc: "Update Layout", body: { sections: [] } },
                    { method: "POST", path: "/api/layouts/publish", desc: "Publish Layout" }
                ]
            },
            {
                name: "Orders & Cart",
                desc: "Transactions",
                endpoints: [
                    { method: "GET", path: "/api/orders", desc: "List Orders" },
                    { method: "GET", path: "/api/cart", desc: "Get Cart" },
                    { method: "POST", path: "/api/cart/add", desc: "Add to Cart", body: { productId: "...", quantity: 1 } }
                ]
            },
            {
                name: "Navigation & Pages",
                desc: "Static Content",
                endpoints: [
                    { method: "GET", path: "/api/navigation", desc: "Get Menu" },
                    { method: "GET", path: "/api/pages", desc: "List Pages" }
                ]
            },
            {
                name: "System",
                desc: "Maintenance & Logs",
                endpoints: [
                    { method: "GET", path: "/api/system/health", desc: "Health Check" },
                    { method: "POST", path: "/api/system/mass-sync", desc: "Mass Sync", body: { targetAttr: "status", newValue: "ACTIVE" } }
                ]
            }
        ];

        function init() {
            const nav = document.getElementById('navItems');
            const main = document.getElementById('content');
            
            API_MODULES.forEach((mod, i) => {
                const li = document.createElement('li');
                li.innerText = mod.name;
                li.onclick = () => showModule(mod.name);
                li.id = "nav-" + mod.name;
                nav.appendChild(li);
                
                const section = document.createElement('div');
                section.className = 'module-section';
                section.id = "mod-" + mod.name;
                
                const h2 = document.createElement('h2');
                h2.innerText = mod.name;
                section.appendChild(h2);
                
                const p = document.createElement('p');
                p.className = 'desc';
                p.innerText = mod.desc;
                section.appendChild(p);
                
                mod.endpoints.forEach((ep, j) => {
                    const card = document.createElement('div');
                    card.className = 'endpoint';
                    
                    const header = document.createElement('div');
                    header.className = 'endpoint-header';
                    header.innerHTML = \`<span class="method \${ep.method}">\${ep.method}</span><span class="path">\${ep.path}</span><span class="desc">\${ep.desc}</span>\`;
                    
                    const body = document.createElement('div');
                    body.className = 'endpoint-body';
                    
                    const panels = document.createElement('div');
                    panels.className = 'panels';
                    
                    const left = document.createElement('div');
                    left.innerHTML = '<h4>Request</h4>';
                    if (ep.method === 'POST' || ep.method === 'PUT') {
                        const area = document.createElement('textarea');
                        area.value = JSON.stringify(ep.body || {}, null, 2);
                        area.id = \`req-\${i}-\${j}\`;
                        left.appendChild(area);
                    } else {
                        const p = document.createElement('p');
                        p.innerText = 'No body required';
                        p.style.fontSize = '12px';
                        p.style.color = '#999';
                        left.appendChild(p);
                    }
                    
                    const btn = document.createElement('button');
                    btn.className = 'send-btn';
                    btn.innerText = 'SEND';
                    btn.onclick = () => send(ep, i, j);
                    left.appendChild(btn);
                    
                    const right = document.createElement('div');
                    right.innerHTML = '<h4>Response</h4>';
                    const respArea = document.createElement('div');
                    respArea.className = 'response-area';
                    respArea.id = \`resp-\${i}-\${j}\`;
                    respArea.innerText = 'Click SEND to test';
                    right.appendChild(respArea);
                    
                    panels.appendChild(left);
                    panels.appendChild(right);
                    body.appendChild(panels);
                    card.appendChild(header);
                    card.appendChild(body);
                    section.appendChild(card);
                });
                
                main.appendChild(section);
            });
            
            showModule(API_MODULES[0].name);
        }

        function showModule(name) {
            document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('nav li').forEach(l => l.classList.remove('active'));
            document.getElementById('mod-' + name).classList.add('active');
            document.getElementById('nav-' + name).classList.add('active');
        }

        async function send(ep, modIdx, epIdx) {
            const shopId = document.getElementById('globalShopId').value;
            const itemId = document.getElementById('globalItemId').value;
            const respArea = document.getElementById(\`resp-\${modIdx}-\${epIdx}\`);
            
            respArea.innerText = 'Loading...';
            
            let url = ep.path.replace(':id', itemId).replace(':shopId', itemId);
            if (!url.startsWith('http')) url = window.location.origin + url;
            
            const options = {
                method: ep.method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-shop-id': shopId
                }
            };
            
            if (ep.method !== 'GET') {
                const text = document.getElementById(\`req-\${modIdx}-\${epIdx}\`).value;
                options.body = text;
            }
            
            try {
                const start = Date.now();
                const res = await fetch(url, options);
                const data = await res.json();
                const time = Date.now() - start;
                
                respArea.innerText = \`Status: \${res.status} \${res.statusText} (\${time}ms)\\n\\n\${JSON.stringify(data, null, 2)}\`;
            } catch (err) {
                respArea.innerText = 'Error: ' + err.message;
            }
        }

        init();
    </script>
</body>
</html>
    `;
  }
}
