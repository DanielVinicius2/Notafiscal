const $ = selector => document.querySelector(selector);

let allNotes = [];
let currentNotes = [];
let editingId = null;
let toastTimer;

document.addEventListener("DOMContentLoaded", () => {
  $("#todayLabel").textContent = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date());
  bindEvents();
  loadDashboard();
  checkApi();
});

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  document.querySelectorAll('[data-action="new"]').forEach(button => button.addEventListener("click", openCreateModal));
  $("#newNoteBtn").addEventListener("click", openCreateModal);
  $("#newNoteBtnList").addEventListener("click", openCreateModal);
  $("#closeModal").addEventListener("click", closeModal);
  $("#cancelModal").addEventListener("click", closeModal);
  $("#noteModal").addEventListener("click", event => { if (event.target === $("#noteModal")) closeModal(); });
  $("#noteForm").addEventListener("submit", saveNote);
  $("#filterBtn").addEventListener("click", applyFilters);
  $("#clearFiltersBtn").addEventListener("click", clearFilters);
  $("#searchInput").addEventListener("keydown", event => { if (event.key === "Enter") applyFilters(); });
  $("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
}

function showView(view) {
  const dashboard = view === "dashboard";
  $("#dashboardView").classList.toggle("hidden", !dashboard);
  $("#notesView").classList.toggle("hidden", dashboard);
  $("#pageTitle").textContent = dashboard ? "Visão geral" : "Notas fiscais";
  $("#pageSubtitle").textContent = dashboard
    ? "Acompanhe os indicadores e as movimentações das suas notas fiscais."
    : "Consulte, pesquise, edite e gerencie suas notas fiscais.";
  $("#breadcrumbCurrent").textContent = dashboard ? "Visão geral" : "Notas fiscais";
  document.querySelectorAll(".nav-item[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  $("#sidebar").classList.remove("open");
  if (!dashboard) loadNotes();
  else loadDashboard();
}

async function checkApi() {
  try {
    await NotaAPI.listar();
    setConnection(true);
  } catch (_) {
    setConnection(false);
  }
}
function setConnection(online) {
  const dot = $(".status-dot");
  dot.classList.toggle("online", online);
  dot.classList.toggle("offline", !online);
  $("#connectionText").textContent = online ? "API conectada" : "API desconectada";
}

async function loadDashboard() {
  try {
    const [notes, total] = await Promise.all([NotaAPI.listar(), NotaAPI.total()]);
    allNotes = normalizeNotes(notes);
    setConnection(true);
    $("#totalNotes").textContent = allNotes.length.toLocaleString("pt-BR");
    $("#totalValue").textContent = currency(total);
    const now = new Date();
    const monthCount = allNotes.filter(note => {
      const date = parseDate(note.dataEmissao);
      return date && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    $("#monthNotes").textContent = monthCount.toLocaleString("pt-BR");
    renderTable(allNotes.slice().sort(sortByIdDescending).slice(0, 5), $("#recentTableBody"), false);
  } catch (error) {
    setConnection(false);
    $("#totalNotes").textContent = "—";
    $("#totalValue").textContent = "—";
    $("#monthNotes").textContent = "—";
    $("#recentTableBody").innerHTML = `<tr><td colspan="6" class="empty-cell">${escapeHtml(error.message)}</td></tr>`;
    showToast(error.message, true);
  }
}

async function loadNotes() {
  try {
    const notes = await NotaAPI.listar();
    allNotes = normalizeNotes(notes);
    currentNotes = allNotes.slice().sort(sortByIdDescending);
    setConnection(true);
    renderNotesTable();
  } catch (error) {
    setConnection(false);
    $("#notesTableBody").innerHTML = `<tr><td colspan="6" class="empty-cell">${escapeHtml(error.message)}</td></tr>`;
    showToast(error.message, true);
  }
}

function normalizeNotes(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

function renderNotesTable() {
  $("#notesCount").textContent = `${currentNotes.length} registro(s) encontrado(s)`;
  renderTable(currentNotes, $("#notesTableBody"), true);
}

function renderTable(notes, tbody, showActions) {
  if (!notes.length) {
    tbody.innerHTML = `<tr><td colspan="${showActions ? 6 : 6}" class="empty-cell">Nenhuma nota fiscal encontrada.</td></tr>`;
    return;
  }
  tbody.innerHTML = notes.map(note => {
    const id = note.id;
    const actions = showActions
      ? `<td><div class="actions">
          <button class="action-btn" data-edit="${escapeAttr(id)}">Editar</button>
          <button class="action-btn delete" data-delete="${escapeAttr(id)}">Excluir</button>
        </div></td>`
      : `<td><span class="action-btn">Registrada</span></td>`;
    return `<tr>
      <td class="number-cell">${escapeHtml(note.numero ?? "—")}</td>
      <td class="client-cell">${escapeHtml(note.nomeCliente ?? "—")}</td>
      <td>${escapeHtml(note.cpfCnpj ?? "—")}</td>
      <td>${formatDate(note.dataEmissao)}</td>
      <td class="value-cell">${currency(note.valorTotal)}</td>
      ${actions}
    </tr>`;
  }).join("");

  tbody.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => editNote(button.dataset.edit)));
  tbody.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => deleteNote(button.dataset.delete)));
}

async function applyFilters() {
  const search = $("#searchInput").value.trim();
  const start = $("#startDate").value;
  const end = $("#endDate").value;
  if ((start && !end) || (!start && end)) {
    showToast("Informe a data inicial e a data final para filtrar por período.", true);
    return;
  }
  if (start && end && start > end) {
    showToast("A data inicial não pode ser maior que a data final.", true);
    return;
  }

  try {
    let result = allNotes;
    if (start && end) result = await NotaAPI.buscarPeriodo(start, end);
    else if (search) {
      const digits = search.replace(/\D/g, "");
      if (/^\d{11}$|^\d{14}$/.test(digits)) {
        try { result = await NotaAPI.buscarDocumento(search); }
        catch (_) { result = await NotaAPI.buscarCliente(search); }
      } else {
        result = await NotaAPI.buscarCliente(search);
      }
    }
    currentNotes = normalizeNotes(result).slice().sort(sortByIdDescending);
    renderNotesTable();
  } catch (error) {
    showToast(error.message, true);
  }
}

function clearFilters() {
  $("#searchInput").value = "";
  $("#startDate").value = "";
  $("#endDate").value = "";
  currentNotes = allNotes.slice().sort(sortByIdDescending);
  renderNotesTable();
}

function openCreateModal() {
  editingId = null;
  $("#noteForm").reset();
  $("#modalTitle").textContent = "Cadastrar nota fiscal";
  $("#saveNoteBtn").textContent = "Salvar nota fiscal";
  $("#noteModal").classList.remove("hidden");
}
async function editNote(id) {
  try {
    const note = await NotaAPI.buscarPorId(id);
    editingId = id;
    const form = $("#noteForm");
    form.elements.numero.value = note.numero ?? "";
    form.elements.dataEmissao.value = note.dataEmissao ?? "";
    form.elements.nomeCliente.value = note.nomeCliente ?? "";
    form.elements.cpfCnpj.value = note.cpfCnpj ?? "";
    form.elements.valorTotal.value = note.valorTotal ?? "";
    form.elements.descricao.value = note.descricao ?? "";
    $("#modalTitle").textContent = "Editar nota fiscal";
    $("#saveNoteBtn").textContent = "Salvar alterações";
    $("#noteModal").classList.remove("hidden");
  } catch (error) {
    showToast(error.message, true);
  }
}
function closeModal() {
  $("#noteModal").classList.add("hidden");
  editingId = null;
  $("#noteForm").reset();
}

async function saveNote(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const note = {
    numero: String(formData.get("numero")).trim(),
    dataEmissao: formData.get("dataEmissao"),
    nomeCliente: String(formData.get("nomeCliente")).trim(),
    cpfCnpj: String(formData.get("cpfCnpj")).trim(),
    valorTotal: Number(formData.get("valorTotal")),
    descricao: String(formData.get("descricao") || "").trim()
  };
  if (!Number.isFinite(note.valorTotal) || note.valorTotal <= 0) {
    showToast("Informe um valor total maior que zero.", true);
    return;
  }

  const button = $("#saveNoteBtn");
  const wasEditing = editingId !== null;
  const noteId = editingId;
  button.disabled = true;
  button.textContent = "Salvando...";
  try {
    if (wasEditing) await NotaAPI.atualizar(noteId, note);
    else await NotaAPI.criar(note);
    closeModal();
    showToast(wasEditing ? "Nota fiscal atualizada com sucesso." : "Nota fiscal cadastrada com sucesso.");
    await Promise.all([loadDashboard(), loadNotes()]);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = "Salvar nota fiscal";
  }
}

async function deleteNote(id) {
  if (!confirm("Tem certeza de que deseja excluir esta nota fiscal?")) return;
  try {
    await NotaAPI.excluir(id);
    showToast("Nota fiscal excluída com sucesso.");
    await Promise.all([loadDashboard(), loadNotes()]);
  } catch (error) {
    showToast(error.message, true);
  }
}

function sortByIdDescending(a, b) {
  return Number(b.id ?? 0) - Number(a.id ?? 0);
}
function parseDate(value) {
  if (!value) return null;
  const parts = String(value).split("-");
  if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatDate(value) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("pt-BR") : "—";
}
function currency(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00";
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
function escapeAttr(value) { return escapeHtml(value ?? ""); }
function showToast(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4200);
}
