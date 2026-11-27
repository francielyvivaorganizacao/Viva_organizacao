
(function () {
  const KEY = "viva_fiscal_v1";
  const CLIENTS_KEY = "viva_clients_v1";

  const obligationTypes = [
    "DAS MEI",
    "DAS Simples Nacional",
    "PGDAS-D",
    "SINTEGRA",
    "DeSTDA",
    "DEFIS",
    "DASN-SIMEI",
    "DCTFWeb",
    "EFD-Reinf",
    "eSocial",
    "FGTS Digital",
    "Folha de pagamento",
    "IRPF",
    "ITR",
    "Outra obrigação"
  ];

  const certificateTypes = [
    "Certidão Negativa Municipal",
    "Certidão Negativa Estadual",
    "Certidão Negativa Federal (RFB/PGFN)",
    "Certidão Negativa Trabalhista (CNDT)",
    "Certificado de Regularidade do FGTS (CRF)"
  ];

  const $ = id => document.querySelector("#" + id);

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      return true;
    } catch {
      alert("Não foi possível salvar os registros.");
      return false;
    }
  }

  function clients() {
    try {
      const data = JSON.parse(localStorage.getItem(CLIENTS_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function todayKey() {
    const d = new Date();

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  }

  function formatDate(value) {
    if (!value) return "Não informada";

    return new Date(value + "T12:00:00")
      .toLocaleDateString("pt-BR");
  }

  function certificateStatus(item) {
    if (!item.issueDate || !item.validUntil) {
      return {
        value: "pending_issue",
        label: "Pendente de emissão"
      };
    }

    const today = new Date(todayKey() + "T00:00:00");
    const expiry = new Date(item.validUntil + "T00:00:00");
    const days = Math.ceil((expiry - today) / 86400000);

    if (days < 0) {
      return {
        value: "expired",
        label: "Vencida"
      };
    }

    if (days <= 30) {
      return {
        value: "expiring",
        label: "Próxima do vencimento"
      };
    }

    return {
      value: "valid",
      label: "Válida"
    };
  }

  function obligationStatus(item) {
    if (item.status === "completed") {
      return {
        value: "completed",
        label: "Concluída"
      };
    }

    if (item.dueDate < todayKey()) {
      return {
        value: "overdue",
        label: "Atrasada"
      };
    }

    return {
      value: "pending",
      label: "Pendente"
    };
  }

  function statusOf(item) {
    return item.category === "certificate"
      ? certificateStatus(item)
      : obligationStatus(item);
  }

  function page() {
    const currentMonth = todayKey().slice(0, 7);

    return `
      <div class="notice">
        Controle de obrigações fiscais, trabalhistas e certidões
        dos clientes do escritório. Os vencimentos devem ser
        conferidos e informados pela profissional.
      </div>

      <div class="finance-summary" id="fiscalSummary"></div>

      <section class="panel">
        <div class="panel-heading">
          <h2>Novo registro fiscal</h2>
          <small>AGENDA FISCAL</small>
        </div>

        <form id="fiscalForm" class="finance-form">

          <label class="form-field">
            <span>Tipo de registro</span>
            <select class="field" id="fiscalCategory">
              <option value="obligation">Obrigação</option>
              <option value="certificate">Certidão</option>
            </select>
          </label>

          <label class="form-field">
            <span>Cliente</span>
            <select class="field" id="fiscalClient" required>
              <option value="">Selecione o cliente</option>
            </select>
          </label>

          <label class="form-field full">
            <span id="fiscalTypeLabel">Obrigação</span>
            <select class="field" id="fiscalType" required></select>
          </label>

          <label class="form-field" id="fiscalOtherWrap" hidden>
            <span>Descreva a obrigação</span>
            <input class="field" id="fiscalOther"
              maxlength="80" placeholder="Nome da obrigação">
          </label>

          <label class="form-field" id="fiscalCompetenceWrap">
            <span>Competência</span>
            <input class="field" type="month"
              id="fiscalCompetence">
          </label>

          <label class="form-field" id="fiscalDueWrap">
            <span>Data de vencimento</span>
            <input class="field" type="date" id="fiscalDue">
          </label>

          <label class="form-field" id="fiscalIssueWrap" hidden>
            <span>Data de emissão</span>
            <input class="field" type="date" id="fiscalIssue">
          </label>

          <label class="form-field" id="fiscalExpiryWrap" hidden>
            <span>Data de validade</span>
            <input class="field" type="date" id="fiscalExpiry">
          </label>

          <label class="form-field full">
            <span>Observações</span>
            <textarea class="field" id="fiscalNotes"
              rows="3" maxlength="500"
              placeholder="Informações adicionais..."></textarea>
          </label>

          <div class="finance-form-actions">
            <button class="primary-btn" id="fiscalSave" type="submit">
              Salvar registro
            </button>

            <button class="secondary-btn" id="fiscalCancel"
              type="button" hidden>
              Cancelar edição
            </button>
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Acompanhamento fiscal</h2>

          <input class="field month-field" type="month"
            id="fiscalMonth" value="${currentMonth}">
        </div>

        <div class="finance-tabs" id="fiscalFilters">
          <button class="secondary-btn selected"
            type="button" data-fiscal-filter="all">Todos</button>

          <button class="secondary-btn"
            type="button" data-fiscal-filter="pending">Pendentes</button>

          <button class="secondary-btn"
            type="button" data-fiscal-filter="completed">Concluídas</button>

          <button class="secondary-btn"
            type="button" data-fiscal-filter="overdue">Atrasadas</button>

          <button class="secondary-btn"
            type="button" data-fiscal-filter="certificates">Certidões</button>
        </div>

        <label class="form-field">
          <span>Filtrar por cliente</span>

          <select class="field" id="fiscalClientFilter">
            <option value="all">Todos os clientes</option>
          </select>
        </label>

        <div id="fiscalList"></div>
      </section>

      <p class="storage-note">
        Os registros ficam salvos somente neste navegador e aparelho.
        Ainda não há sincronização ou backup em nuvem.
        Utilize dados fictícios durante os testes.
      </p>
    `;
  }

  function bind() {
    const form = $("fiscalForm");

    if (!form) return;

    let editing = null;
    let filter = "all";

    const category = $("fiscalCategory");
    const type = $("fiscalType");
    const client = $("fiscalClient");
    const list = $("fiscalList");

    function fillClients() {
      const all = clients();

      const options = all.map(c => `
        <option value="${esc(c.id)}">
          ${esc(c.name)}${c.status === "inactive" ? " (Inativo)" : ""}
        </option>
      `).join("");

      client.innerHTML =
        '<option value="">Selecione o cliente</option>' + options;

      $("fiscalClientFilter").innerHTML =
        '<option value="all">Todos os clientes</option>' + options;
    }

    function fillTypes() {
      const isCertificate = category.value === "certificate";

      const options = isCertificate
        ? certificateTypes
        : obligationTypes;

      type.innerHTML = options.map(t =>
        `<option value="${esc(t)}">${esc(t)}</option>`
      ).join("");

      $("fiscalTypeLabel").textContent =
        isCertificate ? "Tipo de certidão" : "Tipo de obrigação";

      $("fiscalCompetenceWrap").hidden = isCertificate;
      $("fiscalDueWrap").hidden = isCertificate;
      $("fiscalIssueWrap").hidden = !isCertificate;
      $("fiscalExpiryWrap").hidden = !isCertificate;

      $("fiscalOtherWrap").hidden =
        isCertificate || type.value !== "Outra obrigação";

      $("fiscalCompetence").required = !isCertificate;
      $("fiscalDue").required = !isCertificate;
      $("fiscalIssue").required = isCertificate;
      $("fiscalExpiry").required = isCertificate;
    }

    function summary(items) {
      const obligations = items.filter(
        i => i.category === "obligation"
      );

      const certificates = items.filter(
        i => i.category === "certificate"
      );

      const pending = obligations.filter(i =>
        obligationStatus(i).value === "pending"
      ).length;

      const overdue = obligations.filter(i =>
        obligationStatus(i).value === "overdue"
      ).length;

      const attention = certificates.filter(i =>
        ["expiring", "expired", "pending_issue"].includes(
          certificateStatus(i).value
        )
      ).length;

      $("fiscalSummary").innerHTML = `
        <div class="finance-metric">
          <span>Obrigações pendentes</span>
          <strong>${pending}</strong>
        </div>

        <div class="finance-metric">
          <span>Obrigações atrasadas</span>
          <strong>${overdue}</strong>
        </div>

        <div class="finance-metric">
          <span>Certidões que exigem atenção</span>
          <strong>${attention}</strong>
        </div>

        <div class="finance-metric">
          <span>Total de registros</span>
          <strong>${items.length}</strong>
        </div>
      `;
    }

    function draw() {
      const items = load();
      const allClients = clients();

      const names = new Map(
        allClients.map(c => [c.id, c.name])
      );

      summary(items);

      const month = $("fiscalMonth").value;
      const clientFilter = $("fiscalClientFilter").value;

      let visible = items.filter(item => {
        if (clientFilter !== "all" &&
            item.clientId !== clientFilter) {
          return false;
        }

        if (filter === "certificates") {
          return item.category === "certificate";
        }

        if (filter !== "all") {
          return statusOf(item).value === filter;
        }

        return true;
      });

      if (month) {
        visible = visible.filter(item => {
          const date = item.category === "certificate"
            ? item.validUntil || item.issueDate
            : item.dueDate;

          return date && date.slice(0, 7) === month;
        });
      }

      visible.sort((a, b) => {
        const dateA = a.category === "certificate"
          ? a.validUntil || "9999-99-99"
          : a.dueDate;

        const dateB = b.category === "certificate"
          ? b.validUntil || "9999-99-99"
          : b.dueDate;

        return dateA.localeCompare(dateB);
      });

      list.innerHTML = visible.length
        ? `<div class="finance-list">
            ${visible.map(item => {
              const status = statusOf(item);
              const isCertificate =
                item.category === "certificate";

              return `
                <div class="finance-row">

                  <div class="finance-row-main">

                    <span class="finance-type ${
                      status.value === "completed" ||
                      status.value === "valid"
                        ? "income"
                        : "expense"
                    }">
                      ${status.label}
                    </span>

                    <strong>${esc(item.type)}</strong>

                    <small>
                      ${esc(
                        names.get(item.clientId) ||
                        "Cliente não encontrado"
                      )}
                    </small>

                    ${isCertificate
                      ? `<small>
                          Emissão: ${formatDate(item.issueDate)}
                          · Validade: ${formatDate(item.validUntil)}
                        </small>`
                      : `<small>
                          Competência: ${esc(item.competence)}
                          · Vencimento: ${formatDate(item.dueDate)}
                        </small>`
                    }

                    ${item.completedAt
                      ? `<small>
                          Concluída em: ${formatDate(item.completedAt)}
                        </small>`
                      : ""
                    }

                    ${item.notes
                      ? `<small>${esc(item.notes)}</small>`
                      : ""
                    }

                  </div>

                  <div class="finance-row-value">

                    <button class="delete-link" type="button"
                      data-fiscal-edit="${esc(item.id)}">
                      Editar
                    </button>

                    ${!isCertificate &&
                      item.status !== "completed"
                      ? `<button class="delete-link" type="button"
                          data-fiscal-complete="${esc(item.id)}">
                          Concluir
                        </button>`
                      : ""
                    }

                    <button class="delete-link" type="button"
                      data-fiscal-delete="${esc(item.id)}">
                      Excluir
                    </button>

                  </div>
                </div>
              `;
            }).join("")}
          </div>`
        : `<div class="empty-note">
            Nenhum registro encontrado para os filtros selecionados.
          </div>`;
    }

    function reset() {
      editing = null;
      form.reset();

      category.value = "obligation";
      fillTypes();

      $("fiscalSave").textContent = "Salvar registro";
      $("fiscalCancel").hidden = true;
    }

    category.onchange = fillTypes;

    type.onchange = () => {
      $("fiscalOtherWrap").hidden =
        category.value === "certificate" ||
        type.value !== "Outra obrigação";
    };

    form.onsubmit = event => {
      event.preventDefault();

      const isCertificate =
        category.value === "certificate";

      const selectedClient = client.value;

      if (!selectedClient) {
        alert("Selecione um cliente.");
        return;
      }

      let itemType = type.value;

      if (!isCertificate &&
          itemType === "Outra obrigação") {
        itemType = $("fiscalOther").value.trim();

        if (!itemType) {
          alert("Informe o nome da obrigação.");
          return;
        }
      }

      const issueDate = $("fiscalIssue").value;
      const validUntil = $("fiscalExpiry").value;

      if (isCertificate) {
        if (!issueDate || !validUntil) {
          alert(
            "Informe a data de emissão e a data de validade."
          );
          return;
        }

        if (validUntil < issueDate) {
          alert(
            "A validade não pode ser anterior à emissão."
          );
          return;
        }
      } else {
        if (!$("fiscalCompetence").value ||
            !$("fiscalDue").value) {
          alert(
            "Informe a competência e o vencimento."
          );
          return;
        }
      }

      const items = load();
      const old = items.find(i => i.id === editing);

      const record = {
        id: editing || "fis-" + Date.now(),
        clientId: selectedClient,
        category: category.value,
        type: itemType,

        competence: isCertificate
          ? ""
          : $("fiscalCompetence").value,

        dueDate: isCertificate
          ? ""
          : $("fiscalDue").value,

        status: old?.status || "pending",
        completedAt: old?.completedAt || "",

        issueDate: isCertificate ? issueDate : "",
        validUntil: isCertificate ? validUntil : "",

        notes: $("fiscalNotes").value.trim(),

        createdAt: old?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const next = editing
        ? items.map(i => i.id === editing ? record : i)
        : [...items, record];

      if (save(next)) {
        reset();
        draw();
        alert("Registro fiscal salvo com sucesso!");
      }
    };

    $("fiscalCancel").onclick = reset;

    $("fiscalFilters").onclick = event => {
      const button = event.target.closest(
        "[data-fiscal-filter]"
      );

      if (!button) return;

      filter = button.dataset.fiscalFilter;

      document.querySelectorAll("[data-fiscal-filter]").forEach(b =>
        b.classList.toggle("selected", b === button)
      );

      draw();
    };

    $("fiscalMonth").onchange = draw;
    $("fiscalClientFilter").onchange = draw;

    list.onclick = event => {
      const edit = event.target.closest(
        "[data-fiscal-edit]"
      );

      const complete = event.target.closest(
        "[data-fiscal-complete]"
      );

      const remove = event.target.closest(
        "[data-fiscal-delete]"
      );

      const items = load();

      if (edit) {
        const item = items.find(
          i => i.id === edit.dataset.fiscalEdit
        );

        if (!item) return;

        editing = item.id;

        category.value = item.category;
        fillTypes();

        client.value = item.clientId;

        type.value =
          item.category === "obligation" &&
          !obligationTypes.includes(item.type)
            ? "Outra obrigação"
            : item.type;

        $("fiscalOther").value =
          item.category === "obligation" &&
          !obligationTypes.includes(item.type)
            ? item.type
            : "";

        $("fiscalOtherWrap").hidden =
          item.category === "certificate" ||
          type.value !== "Outra obrigação";

        $("fiscalCompetence").value =
          item.competence || "";

        $("fiscalDue").value =
          item.dueDate || "";

        $("fiscalIssue").value =
          item.issueDate || "";

        $("fiscalExpiry").value =
          item.validUntil || "";

        $("fiscalNotes").value =
          item.notes || "";

        $("fiscalSave").textContent =
          "Salvar alterações";

        $("fiscalCancel").hidden = false;

        form.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      if (complete) {
        const item = items.find(
          i => i.id === complete.dataset.fiscalComplete
        );

        if (!item) return;

        item.status = "completed";
        item.completedAt = todayKey();
        item.updatedAt = new Date().toISOString();

        if (save(items)) draw();
      }

      if (remove) {
        const item = items.find(
          i => i.id === remove.dataset.fiscalDelete
        );

        if (!item) return;

        if (!confirm(
          "Deseja realmente excluir este registro?"
        )) return;

        if (save(items.filter(i => i.id !== item.id))) {
          draw();
        }
      }
    };

    fillClients();
    fillTypes();
    draw();
  }

  window.VivaFiscal = { page, bind };
})();
