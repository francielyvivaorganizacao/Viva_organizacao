
(function () {
  const STORAGE_KEY = "viva_studies_v1";

  function loadData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        books: [],
        studies: [],
        goals: { daily: 30, weekly: 300 }
      };
    } catch (error) {
      return {
        books: [],
        studies: [],
        goals: { daily: 30, weekly: 300 }
      };
    }
  }

  let data = loadData();

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(value) {
    if (!value) return "Não informada";
    return new Date(value + "T12:00:00").toLocaleDateString("pt-BR");
  }

  function page() {
    const completed = data.books.filter(b => b.status === "completed").length;
    const minutes = data.studies.reduce((sum, s) => sum + Number(s.minutes || 0), 0);
    const questions = data.studies.reduce((sum, s) => sum + Number(s.questions || 0), 0);

    return `
      <div class="notice">
        Organize seus livros, estudos, metas e evolução em um só lugar.
        Os registros ficam salvos neste navegador.
      </div>

      <div class="finance-summary">
        <div class="finance-metric">
          <span>Livros cadastrados</span>
          <strong>${data.books.length}</strong>
        </div>
        <div class="finance-metric">
          <span>Livros concluídos</span>
          <strong>${completed}</strong>
        </div>
        <div class="finance-metric">
          <span>Tempo estudado</span>
          <strong>${minutes} min</strong>
        </div>
        <div class="finance-metric">
          <span>Questões resolvidas</span>
          <strong>${questions}</strong>
        </div>
      </div>

      <section class="panel">
        <div class="panel-heading">
          <h2>Minha biblioteca</h2>
          <small>LIVROS</small>
        </div>

        <form id="studyBookForm" class="finance-form">
          <label class="form-field">
            <span>Nome do livro</span>
            <input class="field" id="bookTitle" maxlength="100" required>
          </label>

          <label class="form-field">
            <span>Autor</span>
            <input class="field" id="bookAuthor" maxlength="80">
          </label>

          <label class="form-field">
            <span>Categoria</span>
            <select class="field" id="bookCategory">
              <option>Desenvolvimento pessoal</option>
              <option>Finanças</option>
              <option>Ficção</option>
              <option>Religião e espiritualidade</option>
              <option>Profissional</option>
              <option>História</option>
              <option>Outros</option>
            </select>
          </label>

          <label class="form-field">
            <span>Situação da leitura</span>
            <select class="field" id="bookStatus">
              <option value="not_started">Não iniciado</option>
              <option value="reading">Em andamento</option>
              <option value="completed">Concluído</option>
            </select>
          </label>

          <label class="form-field">
            <span>Data de início</span>
            <input class="field" id="bookStart" type="date">
          </label>

          <label class="form-field">
            <span>Data de conclusão</span>
            <input class="field" id="bookEnd" type="date">
          </label>

          <div class="finance-form-actions">
            <button class="primary-btn" type="submit">Cadastrar livro</button>
          </div>
        </form>

        <div class="finance-list">
          ${data.books.length ? data.books.map(book => `
            <div class="finance-row">
              <div class="finance-row-main">
                <strong>${esc(book.title)}</strong>
                <small>${esc(book.author || "Autor não informado")} · ${esc(book.category)}</small>
                <small>
                  ${book.status === "completed" ? "Concluído" :
                    book.status === "reading" ? "Em andamento" : "Não iniciado"}
                  · Início: ${formatDate(book.startDate)}
                  ${book.status === "completed" ? " · Conclusão: " + formatDate(book.endDate) : ""}
                </small>
              </div>
              <div class="finance-row-value">
                <button class="delete-link" data-book-delete="${book.id}">Excluir</button>
              </div>
            </div>
          `).join("") : '<div class="empty-note">Sua biblioteca ainda está vazia.</div>'}
        </div>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Plano de estudos</h2>
          <small>METAS</small>
        </div>

        <form id="studyGoalsForm" class="finance-form">
          <label class="form-field">
            <span>Meta diária (minutos)</span>
            <input class="field" id="dailyGoal" type="number" min="1"
              value="${data.goals.daily}" required>
          </label>
          <label class="form-field">
            <span>Meta semanal (minutos)</span>
            <input class="field" id="weeklyGoal" type="number" min="1"
              value="${data.goals.weekly}" required>
          </label>
          <div class="finance-form-actions">
            <button class="primary-btn" type="submit">Salvar metas</button>
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Registrar estudo</h2>
          <small>ATIVIDADES</small>
        </div>

        <form id="studyLogForm" class="finance-form">
          <label class="form-field">
            <span>Tipo</span>
            <select class="field" id="studyType">
              <option>Concurso</option>
              <option>Curso</option>
              <option>Conteúdo</option>
              <option>Inglês</option>
              <option>Outro</option>
            </select>
          </label>

          <label class="form-field">
            <span>Concurso, curso ou tema</span>
            <input class="field" id="studyName" maxlength="100" required
              placeholder="Ex.: Receita Federal">
          </label>

          <label class="form-field">
            <span>Conteúdo estudado</span>
            <input class="field" id="studyContent" maxlength="120"
              placeholder="Ex.: Contabilidade geral">
          </label>

          <label class="form-field">
            <span>Data</span>
            <input class="field" id="studyDate" type="date" value="${today()}" required>
          </label>

          <label class="form-field">
            <span>Tempo dedicado (minutos)</span>
            <input class="field" id="studyMinutes" type="number" min="0" value="0">
          </label>

          <label class="form-field">
            <span>Questões resolvidas</span>
            <input class="field" id="studyQuestions" type="number" min="0" value="0">
          </label>

          <div class="finance-form-actions">
            <button class="primary-btn" type="submit">Registrar estudo</button>
          </div>
        </form>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Histórico de estudos</h2>
          <small>ACOMPANHAMENTO</small>
        </div>

        <div class="finance-list">
          ${data.studies.length ? [...data.studies].sort((a, b) =>
            b.date.localeCompare(a.date)).map(study => `
            <div class="finance-row">
              <div class="finance-row-main">
                <strong>${esc(study.name)}</strong>
                <small>${esc(study.type)} · ${formatDate(study.date)}</small>
                <small>${esc(study.content || "Sem conteúdo especificado")}</small>
                <small>${study.minutes} minutos · ${study.questions} questões</small>
              </div>
              <div class="finance-row-value">
                <button class="delete-link" data-study-delete="${study.id}">Excluir</button>
              </div>
            </div>
          `).join("") : '<div class="empty-note">Nenhum estudo registrado ainda.</div>'}
        </div>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Histórico de leitura</h2>
          <small>LIVROS CONCLUÍDOS</small>
        </div>
        ${data.books.filter(b => b.status === "completed").length ?
          data.books.filter(b => b.status === "completed").map(book => `
            <div class="item-row">
              <div>
                <strong>${esc(book.title)}</strong>
                <small>${esc(book.author || "Autor não informado")} · Concluído em ${formatDate(book.endDate)}</small>
              </div>
            </div>
          `).join("") :
          '<div class="empty-note">Os livros concluídos aparecerão aqui.</div>'}
      </section>

      <p class="storage-note">
        Os dados ficam salvos somente neste navegador e aparelho.
        Ainda não há sincronização ou backup em nuvem.
      </p>
    `;
  }

  function bind() {
    const bookForm = document.querySelector("#studyBookForm");
    if (bookForm) {
      bookForm.onsubmit = event => {
        event.preventDefault();

        const status = document.querySelector("#bookStatus").value;
        const startDate = document.querySelector("#bookStart").value;
        let endDate = document.querySelector("#bookEnd").value;

        if (status === "completed" && !endDate) {
          endDate = today();
        }

        data.books.push({
          id: String(Date.now()),
          title: document.querySelector("#bookTitle").value.trim(),
          author: document.querySelector("#bookAuthor").value.trim(),
          category: document.querySelector("#bookCategory").value,
          status,
          startDate,
          endDate
        });

        saveData();
        window.VivaStudies.refresh();
      };
    }

    const goalsForm = document.querySelector("#studyGoalsForm");
    if (goalsForm) {
      goalsForm.onsubmit = event => {
        event.preventDefault();
        data.goals = {
          daily: Number(document.querySelector("#dailyGoal").value),
          weekly: Number(document.querySelector("#weeklyGoal").value)
        };
        saveData();
        window.VivaStudies.refresh();
        alert("Metas atualizadas!");
      };
    }

    const logForm = document.querySelector("#studyLogForm");
    if (logForm) {
      logForm.onsubmit = event => {
        event.preventDefault();

        data.studies.push({
          id: String(Date.now()),
          type: document.querySelector("#studyType").value,
          name: document.querySelector("#studyName").value.trim(),
          content: document.querySelector("#studyContent").value.trim(),
          date: document.querySelector("#studyDate").value,
          minutes: Number(document.querySelector("#studyMinutes").value || 0),
          questions: Number(document.querySelector("#studyQuestions").value || 0)
        });

        saveData();
        window.VivaStudies.refresh();
      };
    }

    document.querySelectorAll("[data-book-delete]").forEach(button => {
      button.onclick = () => {
        if (confirm("Excluir este livro da biblioteca?")) {
          data.books = data.books.filter(book => book.id !== button.dataset.bookDelete);
          saveData();
          window.VivaStudies.refresh();
        }
      };
    });

    document.querySelectorAll("[data-study-delete]").forEach(button => {
      button.onclick = () => {
        if (confirm("Excluir este registro de estudo?")) {
          data.studies = data.studies.filter(study => study.id !== button.dataset.studyDelete);
          saveData();
          window.VivaStudies.refresh();
        }
      };
    });
  }

  window.VivaStudies = {
    page,
    bind,
    refresh: function () {
      const content = document.querySelector("#pageContent");
      if (content) {
        content.innerHTML = page();
        bind();
      }
    }
  };
})();
