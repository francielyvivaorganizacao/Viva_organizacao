
(function () {
  const STORAGE_KEY = "viva_clients_v1";

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  function save(clients) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
      return true;
    } catch (error) {
      alert("Não foi possível salvar os clientes neste navegador.");
      return false;
    }
  }

  function escape(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }
  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function validCPF(cpf) {
    cpf = onlyDigits(cpf);
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(cpf[i]) * (10 - i);
    }

    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== Number(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += Number(cpf[i]) * (11 - i);
    }

    digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;

    return digit === Number(cpf[10]);
  }

  function validCNPJ(cnpj) {
    cnpj = onlyDigits(cnpj);
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

    const calculate = (base, weights) => {
      const sum = weights.reduce(
        (total, weight, index) =>
          total + Number(base[index]) * weight, 0
      );
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const first = calculate(
      cnpj.slice(0, 12),
      [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    const second = calculate(
      cnpj.slice(0, 12) + first,
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    return first === Number(cnpj[12]) &&
      second === Number(cnpj[13]);
  }
  function page() {
    const clients = load();
    const active = clients.filter(c => c.status === "active").length;

    return `
      <div class="notice">
        Ambiente demonstrativo. Utilize somente dados fictícios.
        Os registros ficam neste navegador, sem login, sincronização
        ou backup em nuvem.
      </div>

      <div class="finance-summary">
        <div class="finance-metric">
          <span>Total de clientes</span>
          <strong>${clients.length}</strong>
        </div>
        <div class="finance-metric">
          <span>Clientes ativos</span>
          <strong>${active}</strong>
        </div>
        <div class="finance-metric">
          <span>Inativos</span>
          <strong>${clients.length - active}</strong>
        </div>
      </div>

      <section class="panel">
        <div class="panel-heading">
          <h2>Cadastrar cliente</h2>
          <small>PESSOA FÍSICA OU JURÍDICA</small>
        </div>

        <form id="clientForm" class="finance-form">
          <label class="form-field">
            <span>Tipo de pessoa</span>
            <select class="field" id="clientType">
              <option value="PF">Pessoa física</option>
              <option value="PJ">Pessoa jurídica</option>
            </select>
          </label>

          <label class="form-field">
            <span>Nome / Razão social</span>
            <input class="field" id="clientName"
              maxlength="120" required>
          </label>

          <label class="form-field">
            <span>CPF / CNPJ</span>
            <input class="field" id="clientDocument"
              maxlength="20">
          </label>

          <label class="form-field">
            <span>Telefone</span>
            <input class="field" id="clientPhone"
              maxlength="25">
          </label>

          <label class="form-field">
            <span>E-mail</span>
            <input class="field" id="clientEmail"
              type="email" maxlength="120">
          </label>

          <label class="form-field">
            <span>Regime tributário</span>
            <select class="field" id="clientRegime">
              <option value="">Não informado</option>
              <option>MEI</option>
              <option>Simples Nacional</option>
              <option>Lucro Presumido</option>
              <option>Lucro Real</option>
              <option>Pessoa física</option>
              <option>Não se aplica</option>
            </select>
          </label>

          <label class="form-field">
            <span>Município</span>
            <input class="field" id="clientCity" maxlength="80">
          </label>

          <label class="form-field">
            <span>Início do atendimento</span>
            <input class="field" id="clientStart" type="date">
          </label>

          <label class="form-field full">
            <span>Observações não confidenciais</span>
            <textarea class="field" id="clientNotes"
              rows="3" maxlength="500"></textarea>
          </label>

          <div class="finance-form-actions">
            <button class="primary-btn" type="submit">
              Cadastrar cliente
            </button>
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Carteira de clientes</h2>
        </div>

        <input class="field" id="clientSearch"
          placeholder="Pesquisar por nome, CPF/CNPJ ou telefone">

        <div class="finance-tabs">
          <button class="secondary-btn selected"
            data-client-filter="active">Ativos</button>
          <button class="secondary-btn"
            data-client-filter="inactive">Inativos</button>
          <button class="secondary-btn"
            data-client-filter="all">Todos</button>
        </div>

        <div id="clientList"></div>
      </section>
    `;
  }

  function bind() {
    let filter = "active";
    let search = "";
    let editingId = null;

    const form = document.querySelector("#clientForm");
    if (!form) return;

    const list = document.querySelector("#clientList");

    function draw() {
      const clients = load();

      const filtered = clients.filter(client => {
        const matchesStatus =
          filter === "all" || client.status === filter;

        const text = [
          client.name,
          client.document,
          client.phone,
          client.email
        ].join(" ").toLowerCase();

        return matchesStatus && text.includes(search.toLowerCase());
      });

      list.innerHTML = filtered.length
        ? filtered.map(client => `
          <div class="finance-row">
            <div class="finance-row-main">
              <span class="finance-type income">${client.personType}</span>
              <strong>${escape(client.name)}</strong>
              <small>
                ${escape(client.document || "Documento não informado")}
                · ${escape(client.taxRegime || "Regime não informado")}
                · ${escape(client.phone || "Sem telefone")}
              </small>
            </div>
            <div class="finance-row-value">
              <small>${client.status === "active" ? "Ativo" : "Inativo"}</small>
              <button class="delete-link"
                data-client-edit="${client.id}">Editar</button>
              <button class="delete-link"
                data-client-toggle="${client.id}">
                ${client.status === "active" ? "Inativar" : "Reativar"}
              </button>
            </div>
          </div>
        `).join("")
        : '<div class="empty-note">Nenhum cliente encontrado.</div>';
    }

    form.onsubmit = event => {
      event.preventDefault();

      const name = document.querySelector("#clientName").value.trim();
      if (!name) return;

const personType = document.querySelector("#clientType").value;
const documentNumber = onlyDigits(
  document.querySelector("#clientDocument").value
);

if (documentNumber) {
  const valid = personType === "PF"
    ? validCPF(documentNumber)
    : validCNPJ(documentNumber);

  if (!valid) {
    alert(personType === "PF"
      ? "CPF inválido. Confira o número informado."
      : "CNPJ inválido. Confira o número informado."
    );
    return;
  }

  const duplicate = load().some(client =>
    client.id !== editingId &&
    onlyDigits(client.document) === documentNumber
  );

  if (documentNumber && duplicate) {
    alert("Já existe um cliente cadastrado com este CPF/CNPJ.");
    return;
  }
}

      const clients = load();
      const existing = clients.find(c => c.id === editingId);

      const client = {
        id: editingId || `cli-${Date.now()}`,
        personType: document.querySelector("#clientType").value,
        name,
        document: document.querySelector("#clientDocument").value.trim(),
        phone: document.querySelector("#clientPhone").value.trim(),
        email: document.querySelector("#clientEmail").value.trim(),
        taxRegime: document.querySelector("#clientRegime").value,
        city: document.querySelector("#clientCity").value.trim(),
        startDate: document.querySelector("#clientStart").value,
        notes: document.querySelector("#clientNotes").value.trim(),
        status: existing?.status || "active",
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updated = editingId
        ? clients.map(c => c.id === editingId ? client : c)
        : [...clients, client];

      if (save(updated)) {
        editingId = null;
        renderPage();
      }
    };

    function renderPage() {
      const container = document.querySelector("#pageContent");
      container.innerHTML = page();
      bind();
    }

    document.querySelector("#clientSearch").oninput = event => {
      search = event.target.value;
      draw();
    };

    document.querySelectorAll("[data-client-filter]").forEach(button => {
      button.onclick = () => {
        filter = button.dataset.clientFilter;
        document.querySelectorAll("[data-client-filter]")
          .forEach(b => b.classList.toggle("selected", b === button));
        draw();
      };
    });

    list.onclick = event => {
      const editButton = event.target.closest("[data-client-edit]");
      const toggleButton = event.target.closest("[data-client-toggle]");

      if (editButton) {
        const client = load().find(c => c.id === editButton.dataset.clientEdit);
        if (!client) return;

        editingId = client.id;
        document.querySelector("#clientType").value = client.personType;
        document.querySelector("#clientName").value = client.name;
        document.querySelector("#clientDocument").value = client.document;
        document.querySelector("#clientPhone").value = client.phone;
        document.querySelector("#clientEmail").value = client.email;
        document.querySelector("#clientRegime").value = client.taxRegime;
        document.querySelector("#clientCity").value = client.city;
        document.querySelector("#clientStart").value = client.startDate;
        document.querySelector("#clientNotes").value = client.notes;
        document.querySelector("#clientName").focus();
      }

      if (toggleButton) {
        const clients = load();
        const client = clients.find(c => c.id === toggleButton.dataset.clientToggle);
        if (!client) return;

        client.status = client.status === "active" ? "inactive" : "active";
        client.updatedAt = new Date().toISOString();

        if (save(clients)) draw();
      }
    };

    draw();
  }

  window.VivaClients = { page, bind };
})();
