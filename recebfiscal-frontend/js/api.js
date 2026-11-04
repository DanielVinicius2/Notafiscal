// Endereço da API Spring Boot. Altere caso sua aplicação use outra porta ou caminho.
const API_BASE_URL = "http://localhost:8080/notas";

async function apiRequest(path = "", options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
  } catch (error) {
    throw new Error("Não foi possível conectar à API. Confira se o Spring Boot está em execução e se o endereço está correto.");
  }

  if (!response.ok) {
    let message = `Erro HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch (_) {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch (_) {}
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : null;
}

const NotaAPI = {
  listar: () => apiRequest(""),
  buscarPorId: id => apiRequest(`/${encodeURIComponent(id)}`),
  criar: nota => apiRequest("", { method: "POST", body: JSON.stringify(nota) }),
  atualizar: (id, nota) => apiRequest(`/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(nota) }),
  excluir: id => apiRequest(`/${encodeURIComponent(id)}`, { method: "DELETE" }),
  buscarDocumento: documento => apiRequest(`/documento/${encodeURIComponent(documento)}`),
  buscarCliente: nome => apiRequest(`/cliente?nome=${encodeURIComponent(nome)}`),
  buscarPeriodo: (inicio, fim) => apiRequest(`/periodo?dataInicial=${encodeURIComponent(inicio)}&dataFinal=${encodeURIComponent(fim)}`),
  total: () => apiRequest("/total")
};
