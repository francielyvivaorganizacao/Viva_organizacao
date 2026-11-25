
(function () {
  const KEY = "viva_contracts_v1";

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  };

  const save = items => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      return true;
    } catch {
      alert("Não foi possível salvar os contratos.");
      return false;
    }
  };

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    }[c]));

  const money = value =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  function page() {
    const clients = JSON.parse(
      localStorage.getItem("viva_clients_v1") || "[]"
    ).filter(c => c.status === "active");

    const options = clients.map(c =>
      `<option value="${esc(c.id)}">${esc(c.name)}</option>`
    ).join("");

    const active = load().filter(c => c.status === "active").length;

    return `
      <section class="panel" id="contractsPanel">
        <div class="panel-heading">
          <h2>Serviços contratados e honorários</h2>
          <small>${active} contrato(s) ativo(s)</small>
        </div>

        <div class="notice">
          Cadastre os serviços e honorários vinculados a cada cliente.
          Ainda não há lançamentos no Financeiro.
        </div>

        <form id="contractForm" class="finance-form">
          <label class="form-field">
            <span>Cliente</span>
            <select class="field" id="ctClient" required>
              <option value="">Selecione</option>${options}
            </select>
          </label>

          <label class="form-field">
            <span>Serviço contratado</span>
            <input class="field" id="ctService" maxlength="120"
              required placeholder="Ex.: Contabilidade mensal">
          </label>

          <label class="form-field">
            <span>Tipo de cobrança</span>
            <select class="field" id="ctFrequency">
              <option value="monthly">Mensal</option>
              <option value="one_time">Avulso / parcela única</option>
            </select>
          </label>

          <label class="form-field">
            <span>Valor (R$)</span>
            <input class="field" id="ctAmount" inputmode="decimal"
              placeholder="0,00" required>
          </label>

          <label class="form-field" id="ctDayWrap">
            <span>Dia de vencimento (1 a 31)</span>
            <input class="field" id="ctDay" type="number"
              min="1" max="31" value="10">
          </label>

          <label class="form-field">
            <span>Início do contrato</span>
            <input class="field" id="ctStart" type="date" required>
          </label>

          <label class="form-field" id="ctDateWrap" hidden>
            <span>Data prevista da cobrança</span>
            <input class="field" id="ctDate" type="date">
          </label>

          <label class="form-field full">
            <span>Descrição / observações</span>
            <textarea class="field" id="ctNotes"
              rows="2" maxlength="400"></textarea>
          </label>

          <div class="finance-form-actions">
            <button class="primary-btn" id="ctSave" type="submit">
              Cadastrar contrato
            </button>
            <button class="secondary-btn" id="ctCancel"
              type="button" hidden>
              Cancelar edição
            </button>
          </div>
        </form>

        <div class="section-title">Contratos cadastrados</div>

        <div class="finance-tabs" id="ctFilters">
          <button class="secondary-btn selected"
            type="button" data-ct-filter="active">Ativos</button>
          <button class="secondary-btn"
            type="button" data-ct-filter="inactive">Inativos</button>
          <button class="secondary-btn"
            type="button" data-ct-filter="all">Todos</button>
        </div>

        <div id="ctList"></div>
      </section>`;
  }

  function bind() {
    const form = document.querySelector("#contractForm");
    if (!form) return;

    let editing = null;
    let filter = "active";

    const $ = id => document.querySelector("#" + id);
    const frequency = $("ctFrequency");
    const list = $("ctList");

    function sync() {
      const monthly = frequency.value === "monthly";
      $("ctDayWrap").hidden = !monthly;
      $("ctDateWrap").hidden = monthly;
      $("ctDay").required = monthly;
      $("ctDate").required = !monthly;
    }

    function draw() {
      const clients = JSON.parse(
        localStorage.getItem("viva_clients_v1") || "[]"
      );

      const names = new Map(clients.map(c => [c.id, c.name]));

      const rows = load().filter(c =>
        filter === "all" || c.status === filter
      );

      list.innerHTML = rows.length
        ? rows.map(c => `
          <div class="finance-row">
            <div class="finance-row-main">
              <span class="finance-type income">
                ${c.frequency === "monthly" ? "Mensal" : "Avulso"}
              </span>
              <strong>${esc(c.service)}</strong>
              <small>
                ${esc(names.get(c.clientId) || "Cliente não encontrado")}
                · ${c.frequency === "monthly"
                  ? "Vencimento dia " + c.dueDay
                  : "Cobrança em " + c.dueDate}
              </small>
              <small>${esc(c.notes)}</small>
            </div>

            <div class="finance-row-value">
              <strong>${money(c.amount)}</strong>
              <small>${c.status === "active" ? "Ativo" : "Inativo"}</small>
              <button class="delete-link" type="button"
                data-ct-edit="${esc(c.id)}">Editar</button>
              <button class="delete-link" type="button"
                data-ct-toggle="${esc(c.id)}">
                ${c.status === "active" ? "Inativar" : "Reativar"}
              </button>
            </div>
          </div>
        `).join("")
        : '<div class="empty-note">Nenhum contrato encontrado.</div>';
    }

    function reset() {
      editing = null;
      form.reset();
      frequency.value = "monthly";
      sync();
      $("ctSave").textContent = "Cadastrar contrato";
      $("ctCancel").hidden = true;
    }

    frequency.onchange = sync;
    sync();

    form.onsubmit = event => {
      event.preventDefault();

      const amount = Number(
        $("ctAmount").value.trim()
          .replace(/\s/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
      );

      const day = Number($("ctDay").value);

      if (!$("ctClient").value)
        return alert("Selecione um cliente.");

      if (!Number.isFinite(amount) || amount <= 0)
        return alert("Informe um valor válido maior que zero.");

      if (frequency.value === "monthly" &&
          (!Number.isInteger(day) || day < 1 || day > 31))
        return alert("Informe um vencimento entre 1 e 31.");

      if (frequency.value === "one_time" && !$("ctDate").value)
        return alert("Informe a data da cobrança.");

      const items = load();
      const old = items.find(c => c.id === editing);

      const item = {
        id: editing || "ctr-" + Date.now(),
        clientId: $("ctClient").value,
        service: $("ctService").value.trim(),
        frequency: frequency.value,
        amount,
        dueDay: frequency.value === "monthly" ? day : null,
        startDate: $("ctStart").value,
        dueDate: frequency.value === "one_time"
          ? $("ctDate").value : null,
        notes: $("ctNotes").value.trim(),
        status: old?.status || "active",
        createdAt: old?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const next = editing
        ? items.map(c => c.id === editing ? item : c)
        : [...items, item];

      if (save(next)) {
        reset();
        draw();
      }
    };

    $("ctCancel").onclick = reset;

    $("ctFilters").onclick = event => {
      const button = event.target.closest("[data-ct-filter]");
      if (!button) return;

      filter = button.dataset.ctFilter;

      document.querySelectorAll("[data-ct-filter]").forEach(b =>
        b.classList.toggle("selected", b === button)
      );

      draw();
    };

    list.onclick = event => {
      const edit = event.target.closest("[data-ct-edit]");
      const toggle = event.target.closest("[data-ct-toggle]");
      const items = load();

      if (edit) {
        const c = items.find(x => x.id === edit.dataset.ctEdit);
        if (!c) return;

        editing = c.id;
        $("ctClient").value = c.clientId;
        $("ctService").value = c.service;
        frequency.value = c.frequency;
        $("ctAmount").value = String(c.amount).replace(".", ",");
        $("ctDay").value = c.dueDay || 10;
        $("ctStart").value = c.startDate || "";
        $("ctDate").value = c.dueDate || "";
        $("ctNotes").value = c.notes || "";

        $("ctSave").textContent = "Salvar alterações";
        $("ctCancel").hidden = false;
        sync();

        form.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      if (toggle) {
        const c = items.find(x => x.id === toggle.dataset.ctToggle);
        if (!c) return;

        c.status = c.status === "active" ? "inactive" : "active";
        c.updatedAt = new Date().toISOString();

        if (save(items)) draw();
      }
    };

    draw();
  }

  window.VivaContracts = { page, bind };
})();
