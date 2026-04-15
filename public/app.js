const UI_TEXT = {
  createLabel: 'Salvar registro',
  updateLabel: 'Atualizar registro',
  emptyRanking: 'Nenhum item no ranking ainda.',
  emptyHistory: 'Nenhum registro encontrado.',
  openStatus: 'Em aberto',
  doneStatus: 'Concluido',
  doneAction: 'Concluir',
};

const form = document.getElementById('sale-form');
const saleIdInput = document.getElementById('saleId');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const message = document.getElementById('message');
const rankingBody = document.getElementById('ranking-body');
const salesBody = document.getElementById('sales-body');
const totalSalesEl = document.getElementById('total-sales');
const sellersCountEl = document.getElementById('sellers-count');
const recordsCountEl = document.getElementById('records-count');
const leaderNameEl = document.getElementById('leader-name');
const clearHistoryBtn = document.getElementById('clear-history-btn');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function renderEmptyRow(colspan, text) {
  return `<tr><td colspan="${colspan}" class="empty-state">${escapeHtml(text)}</td></tr>`;
}

function resetForm() {
  saleIdInput.value = '';
  form.reset();
  form.quantity.value = 1;
  submitButton.textContent = UI_TEXT.createLabel;
  cancelButton.classList.add('hidden');
}

function showMessage(text, type = 'success') {
  message.textContent = text;
  message.className = `message ${type}`;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || 'Erro ao processar a requisicao.');
  }

  return payload;
}

async function fetchRanking() {
  const ranking = await fetchJson('/api/ranking');

  rankingBody.innerHTML = ranking.length
    ? ranking.map((item) => `
      <tr>
        <td>${item.rank}</td>
        <td>${escapeHtml(item.ownerName || item.sellerName)}</td>
        <td>${item.score || item.totalQuantity}</td>
      </tr>
    `).join('')
    : renderEmptyRow(3, UI_TEXT.emptyRanking);

  return ranking;
}

async function fetchSales() {
  const sales = await fetchJson('/api/sales');

  salesBody.innerHTML = sales.length
    ? sales.map((sale) => {
      const isDone = sale.status === 'entregue';
      const statusClass = isDone ? 'status-entregue' : 'status-pendente';
      const statusText = isDone ? UI_TEXT.doneStatus : UI_TEXT.openStatus;
      const deliverButton = isDone
        ? ''
        : `<button type="button" class="action-button deliver-btn" data-id="${sale.id}">${UI_TEXT.doneAction}</button>`;

      return `
        <tr>
          <td>${escapeHtml(sale.ownerName || sale.sellerName)}</td>
          <td>${escapeHtml(sale.referenceName || sale.customerName)}</td>
          <td>${escapeHtml(sale.details || sale.customerAddress)}</td>
          <td>${sale.score || sale.quantity}</td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
          <td>
            ${deliverButton}
            <button
              type="button"
              class="action-button edit-btn"
              data-id="${sale.id}"
              data-seller="${escapeHtml(sale.sellerName)}"
              data-customer="${escapeHtml(sale.customerName)}"
              data-address="${escapeHtml(sale.customerAddress)}"
              data-qty="${sale.quantity}"
            >
              Editar
            </button>
            <button type="button" class="action-button delete-btn" data-id="${sale.id}">Excluir</button>
          </td>
        </tr>
      `;
    }).join('')
    : renderEmptyRow(6, UI_TEXT.emptyHistory);

  return sales;
}

function updateSummary(sales, ranking) {
  const totalQuantity = sales.reduce((sum, sale) => sum + Number(sale.quantity), 0);
  const sellers = new Set(sales.map((sale) => sale.sellerName));
  const leaderName = ranking.length ? ranking[0].ownerName || ranking[0].sellerName : '-';

  totalSalesEl.textContent = totalQuantity;
  sellersCountEl.textContent = sellers.size;
  recordsCountEl.textContent = sales.length;
  leaderNameEl.textContent = leaderName;
}

async function loadData() {
  const [sales, ranking] = await Promise.all([fetchSales(), fetchRanking()]);
  updateSummary(sales, ranking);
}

async function saveSale(saleData, method, url) {
  await fetchJson(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  });

  resetForm();
  await loadData();
  showMessage(method === 'PUT' ? 'Registro atualizado com sucesso!' : 'Registro salvo com sucesso!');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';

  const saleData = {
    sellerName: form.sellerName.value.trim(),
    customerName: form.customerName.value.trim(),
    customerAddress: form.customerAddress.value.trim(),
    quantity: Number(form.quantity.value),
  };

  if (!saleData.sellerName || !saleData.customerName || !saleData.customerAddress || !Number.isInteger(saleData.quantity) || saleData.quantity < 1) {
    showMessage('Preencha todos os campos corretamente.', 'error');
    return;
  }

  try {
    const saleId = saleIdInput.value;

    if (saleId) {
      await saveSale(saleData, 'PUT', `/api/sales/${saleId}`);
    } else {
      await saveSale(saleData, 'POST', '/api/sales');
    }
  } catch (error) {
    showMessage(error.message || 'Erro ao salvar o registro.', 'error');
  }
});

cancelButton.addEventListener('click', () => {
  resetForm();
  message.textContent = '';
});

salesBody.addEventListener('click', async (event) => {
  const editButton = event.target.closest('.edit-btn');
  const deleteButton = event.target.closest('.delete-btn');
  const deliverButton = event.target.closest('.deliver-btn');

  if (editButton) {
    form.sellerName.value = editButton.dataset.seller;
    form.customerName.value = editButton.dataset.customer;
    form.customerAddress.value = editButton.dataset.address;
    form.quantity.value = editButton.dataset.qty;
    saleIdInput.value = editButton.dataset.id;
    submitButton.textContent = UI_TEXT.updateLabel;
    cancelButton.classList.remove('hidden');
    showMessage('Modo de edicao ativado. Atualize os dados ou cancele.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (deleteButton) {
    const confirmed = confirm('Deseja realmente excluir este registro?');
    if (!confirmed) {
      return;
    }

    try {
      await fetchJson(`/api/sales/${deleteButton.dataset.id}`, { method: 'DELETE' });
      resetForm();
      await loadData();
      showMessage('Registro excluido com sucesso!');
    } catch (error) {
      showMessage(error.message || 'Erro ao excluir o registro.', 'error');
    }

    return;
  }

  if (deliverButton) {
    try {
      await fetchJson(`/api/sales/${deliverButton.dataset.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'concluido' }),
      });

      await loadData();
      showMessage('Registro marcado como concluido!');
    } catch (error) {
      showMessage(error.message || 'Erro ao atualizar o status.', 'error');
    }
  }
});

clearHistoryBtn.addEventListener('click', async () => {
  const confirmed = confirm('Deseja realmente apagar todo o historico? Esta acao nao pode ser desfeita.');
  if (!confirmed) {
    return;
  }

  try {
    await fetchJson('/api/sales/clean/all', { method: 'DELETE' });
    resetForm();
    await loadData();
    showMessage('Historico apagado com sucesso!');
  } catch (error) {
    showMessage(error.message || 'Erro ao limpar o historico.', 'error');
  }
});

window.addEventListener('load', () => {
  resetForm();
  loadData().catch((error) => {
    showMessage(error.message || 'Nao foi possivel carregar os dados.', 'error');
  });
});
