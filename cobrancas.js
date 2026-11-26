
(function () {
  const KEY = "viva_charges_v1";
  const CLIENTS_KEY = "viva_clients_v1";
  const CONTRACTS_KEY = "viva_contracts_v1";

  const load = key => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  };

  const save = charges => {
    try {
      localStorage.setItem(KEY, JSON.stringify(charges));
      return true;
    } catch {
      alert("Não foi possível salvar as cobranças.");
      return false;
    }
  };

  const money = value =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    }[c]));

  function dueDateForMonth(competence, day) {
    const [year, month] = competence.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(
      Math.min(Number(day), lastDay)
    ).padStart(2, "0")}`;
  }

  function page() {
    const competence = new Date().toISOString().slice(0, 7);

    return `
      <section class="panel" id="chargesPanel">
        <div class="panel-heading">
          <h2>Cobranças e honorários</h2>
          <small>CONTROLE DE RECEBIMENTOS</small>
        </div>

        <div class="notice">
          As cobranças geradas ficam em rascunho para sua conferência.
          Nenhuma cobrança será lançada no Financeiro automaticamente.
        </div>

        <div class="finance-form">
          <label class="form-field">
            <span>Competência</span>
            <input class="field" type="month"
              id="chargeCompetence" value="${competence}">
          </label>

          <div class="finance-form-actions">
            <button class="primary-btn" type="button" id="generateCharges">
              Gerar cobranças para conferência
            </button>
          </div>
        </div>

        <div class="section-title">Cobranças geradas</div>
        <div id="chargeList"></div>
      </section>
    `;
  }

  function bind() {
    const button = document.querySelector("#generateCharges");
    const list = document.querySelector("#chargeList");
    const competenceInput =
      document.querySelector("#chargeCompetence");

    if (!button || !list || !competenceInput) return;

    function draw() {
  const charges = load(KEY);
  const clients = load(CLIENTS_KEY);
  const names = new Map(clients.map(c => [c.id, c.name]));

  const visible = charges
    .slice()
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  list.innerHTML = visible.length
    ? visible.map(charge => {
        const payments = charge.payments || [];

        const received = payments.reduce(
          (total, payment) => total + Number(payment.amount || 0),
          0
        );

        const balance = Math.max(
          0,
          Number(charge.amount) - received
        );

        let statusLabel = "Rascunho";

        if (charge.status === "posted") {
          statusLabel = "Pendente";
        } else if (charge.status === "partial") {
          statusLabel = "Pagamento parcial";
        } else if (charge.status === "paid") {
          statusLabel = "Quitada";
        }

        return `
          <div class="finance-row">
            <div class="finance-row-main">
              <span class="finance-type income">
                ${statusLabel}
              </span>

              <strong>${esc(charge.service)}</strong>

              <small>
                ${esc(names.get(charge.clientId) || "Cliente não encontrado")}
                · Competência ${esc(charge.competence)}
              </small>

              <small>
                Vencimento: ${new Date(
                  charge.dueDate + "T12:00:00"
                ).toLocaleDateString("pt-BR")}
              </small>

              <small>
                Valor original: ${money(charge.amount)}
              </small>

              <small>
                Valor recebido: ${money(received)}
              </small>

              <small>
                Saldo pendente: ${money(balance)}
              </small>
            </div>

            <div class="finance-row-value">
              <strong>${money(charge.amount)}</strong>

              ${
                charge.status === "draft"
                  ? `<button class="primary-btn" type="button"
                      data-charge-confirm="${esc(charge.id)}">
                      Confirmar cobrança
                    </button>`
                  : balance > 0
                    ? `<button class="primary-btn" type="button"
                        data-charge-payment="${esc(charge.id)}">
                        Registrar pagamento
                      </button>`
                    : `<small>Pagamento concluído</small>`
              }
            </div>
          </div>
        `;
      }).join("")
    : '<div class="empty-note">Nenhuma cobrança gerada ainda.</div>';
}

    button.onclick = () => {
      const competence = competenceInput.value;

      if (!/^\d{4}-\d{2}$/.test(competence)) {
        alert("Selecione uma competência válida.");
        return;
      }

      const contracts = load(CONTRACTS_KEY)
        .filter(c => c.status === "active");

      const clients = load(CLIENTS_KEY);
      const activeClients = new Set(
        clients.filter(c => c.status === "active").map(c => c.id)
      );

      const charges = load(KEY);
      const generated = [];

      contracts.forEach(contract => {
        if (!activeClients.has(contract.clientId)) return;

        let dueDate = "";

        if (contract.frequency === "monthly") {
          const monthStart = competence + "-01";

          if (!contract.startDate || contract.startDate > 
              dueDateForMonth(competence, 31)) return;

          dueDate = dueDateForMonth(competence, contract.dueDay);
        } else if (contract.frequency === "one_time") {
          if (!contract.dueDate ||
              contract.dueDate.slice(0, 7) !== competence) return;

          dueDate = contract.dueDate;
        } else {
          return;
        }

        const alreadyExists = charges.some(charge =>
          charge.contractId === contract.id &&
          charge.competence === competence
        );

        if (alreadyExists) return;

        generated.push({
          id: "chg-" + Date.now() + "-" +
            Math.random().toString(16).slice(2),
          clientId: contract.clientId,
          contractId: contract.id,
          service: contract.service,
          competence,
          amount: Number(contract.amount),
          dueDate,
          status: "draft",
          payments: [],
          createdAt: new Date().toISOString()
        });
      });

      if (!generated.length) {
        alert(
          "Nenhuma nova cobrança encontrada. Confira os contratos ativos, " +
          "os clientes e a competência selecionada."
        );
        return;
      }

      if (save([...charges, ...generated])) {
        alert(
          generated.length + " cobrança(s) gerada(s) para conferência."
        );
        draw();
      }
    };

 list.onclick = event => {
  const confirmButton = event.target.closest("[data-charge-confirm]");
  const paymentButton = event.target.closest("[data-charge-payment]");

  // CONFIRMAR COBRANÇA
  if (confirmButton) {
    const chargeId = confirmButton.dataset.chargeConfirm;
    const charges = load(KEY);
    const charge = charges.find(c => c.id === chargeId);

    if (!charge || charge.status !== "draft") {
      alert("Esta cobrança já foi confirmada ou não está disponível.");
      return;
    }

    if (!confirm(
      "Confirma esta cobrança e o envio como receita pendente ao Financeiro?"
    )) return;

    const clients = load(CLIENTS_KEY);
    const client = clients.find(c => c.id === charge.clientId);

    if (!client) {
      alert("Cliente não encontrado. A cobrança não foi enviada.");
      return;
    }

    let finance;

    try {
      finance = JSON.parse(
        localStorage.getItem("viva_office_finance_v1")
      ) || { transactions: [] };
    } catch {
      alert("Não foi possível acessar o Financeiro.");
      return;
    }

    finance.transactions = finance.transactions || [];

    const alreadyPosted = finance.transactions.some(
      t => t.chargeId === charge.id &&
        t.source === "client_charge"
    );

    if (alreadyPosted) {
      alert("Esta cobrança já consta no Financeiro.");
      return;
    }

    const transactionId = "fin-" + Date.now();

    finance.transactions.push({
      id: transactionId,
      type: "income",
      description: charge.service,
      amount: charge.amount,
      date: charge.dueDate,
      category: "Honorários mensais",
      client: client.name,
      clientId: client.id,
      chargeId: charge.id,
      source: "client_charge",
      status: "pending"
    });

    try {
      localStorage.setItem(
        "viva_office_finance_v1",
        JSON.stringify(finance)
      );
    } catch {
      alert("Não foi possível registrar a receita no Financeiro.");
      return;
    }

    charge.status = "posted";
    charge.financeTransactionId = transactionId;

    if (!save(charges)) {
      alert("Atenção: confira o Financeiro antes de tentar novamente.");
      return;
    }

    alert("Cobrança confirmada e enviada ao Financeiro como pendente.");
    draw();
    return;
  }

  // REGISTRAR PAGAMENTO
  if (paymentButton) {
    const chargeId = paymentButton.dataset.chargePayment;
    const charges = load(KEY);
    const charge = charges.find(c => c.id === chargeId);

    if (!charge || !["posted", "partial"].includes(charge.status)) {
      alert("Esta cobrança não está disponível para pagamento.");
      return;
    }

    charge.payments = charge.payments || [];

    const received = charge.payments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    const balance = Number(charge.amount) - received;

    if (balance <= 0) {
      alert("Esta cobrança já está quitada.");
      return;
    }

    const amountText = prompt(
      "Informe o valor recebido. Saldo pendente: " +
      money(balance)
    );

    if (amountText === null) return;

    const paymentAmount = Number(
      amountText.replace(",", ".")
    );

    if (
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0 ||
      paymentAmount > balance
    ) {
      alert("Informe um valor válido, maior que zero e até o saldo pendente.");
      return;
    }

    const today = new Date();
    const defaultDate =
      today.getFullYear() + "-" +
      String(today.getMonth() + 1).padStart(2, "0") + "-" +
      String(today.getDate()).padStart(2, "0");

    const paymentDate = prompt(
      "Informe a data do recebimento (AAAA-MM-DD):",
      defaultDate
    );

    if (paymentDate === null) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      alert("Informe a data no formato AAAA-MM-DD.");
      return;
    }

    const clients = load(CLIENTS_KEY);
    const client = clients.find(c => c.id === charge.clientId);

    if (!client) {
      alert("Cliente não encontrado.");
      return;
    }

    let finance;

    try {
      finance = JSON.parse(
        localStorage.getItem("viva_office_finance_v1")
      ) || { transactions: [] };
    } catch {
      alert("Não foi possível acessar o Financeiro.");
      return;
    }

    finance.transactions = finance.transactions || [];

    const pendingTransaction = finance.transactions.find(
      t => t.chargeId === charge.id &&
        t.source === "client_charge"
    );

    if (!pendingTransaction) {
      alert("Não foi encontrada a receita pendente desta cobrança.");
      return;
    }

    const paymentId = "pay-" + Date.now();

    charge.payments.push({
      id: paymentId,
      amount: paymentAmount,
      date: paymentDate,
      createdAt: new Date().toISOString()
    });

    const newReceived = received + paymentAmount;
    const newBalance = Math.max(
      0,
      Number(charge.amount) - newReceived
    );

    charge.status = newBalance === 0 ? "paid" : "partial";

    pendingTransaction.amount = newBalance;
    pendingTransaction.status = newBalance === 0 ? "paid" : "pending";

    finance.transactions.push({
      id: "fin-pay-" + Date.now(),
      type: "income",
      description: charge.service + " - recebimento",
      amount: paymentAmount,
      date: paymentDate,
      category: "Honorários mensais",
      client: client.name,
      clientId: client.id,
      chargeId: charge.id,
      paymentId,
      source: "client_charge_payment",
      status: "paid"
    });

    try {
      localStorage.setItem(
        "viva_office_finance_v1",
        JSON.stringify(finance)
      );
    } catch {
      alert("Não foi possível atualizar o Financeiro.");
      return;
    }

    if (!save(charges)) {
      alert("Atenção: confira a cobrança e o Financeiro antes de repetir o lançamento.");
      return;
    }

    alert(
      "Pagamento registrado!\n" +
      "Recebido: " + money(paymentAmount) + "\n" +
      "Saldo restante: " + money(newBalance)
    );

    draw();
  }
};

  draw();
}

window.VivaCharges = { page, bind };
})();