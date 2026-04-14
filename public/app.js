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

function resetForm() {
  saleIdInput.value = '';
  form.reset();
  form.quantity.value = 1;
  submitButton.textContent = 'Enviar Venda';
  cancelButton.classList.add('hidden');
}

function showMessage(text, type = 'success') {
  message.textContent = text;
  message.className = `message ${type}`;
}

async function fetchRanking() {
  const response = await fetch('/api/ranking');
  const ranking = await response.json();
  rankingBody.innerHTML = ranking.map(item => `
    <tr>
      <td>${item.rank}º</td>
      <td>${item.sellerName}</td>
      <td>${item.totalQuantity}</td>
    </tr>
  `).join('');
  return ranking;
}

async function fetchSales() {
  const response = await fetch('/api/sales');
  const sales = await response.json();
  salesBody.innerHTML = sales.map(sale => {
    const statusClass = sale.status === 'entregue' ? 'status-entregue' : 'status-pendente';
    const statusText = sale.status === 'entregue' ? '✓ Entregue' : '⏳ Pendente';
    const deliverButton = sale.status === 'pendente' ? `<button type="button" class="action-button deliver-btn" data-id="${sale.id}">Pedido Entregue</button>` : '';

    return `
      <tr>
        <td>${sale.sellerName}</td>
        <td>${sale.customerName}</td>
        <td>${sale.customerAddress}</td>
        <td>${sale.quantity}</td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
        <td>
          ${deliverButton}
          <button type="button" class="action-button edit-btn" data-id="${sale.id}" data-seller="${sale.sellerName}" data-customer="${sale.customerName}" data-address="${sale.customerAddress}" data-qty="${sale.quantity}">Editar</button>
          <button type="button" class="action-button delete-btn" data-id="${sale.id}">Deletar</button>
        </td>
      </tr>
    `;
  }).join('');
  return sales;
}

function updateSummary(sales, ranking) {
  const totalQuantity = sales.reduce((sum, sale) => sum + Number(sale.quantity), 0);
  const sellers = new Set(sales.map(sale => sale.sellerName));
  const leaderName = ranking.length ? ranking[0].sellerName : '-';

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
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  });

  if (response.ok) {
    resetForm();
    await loadData();
    showMessage(method === 'PUT' ? 'Venda atualizada com sucesso!' : 'Venda registrada com sucesso!');
  } else {
    const error = await response.json();
    showMessage(error.error || 'Erro ao salvar venda.', 'error');
  }
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

  if (!saleData.sellerName || !saleData.customerName || !saleData.customerAddress || saleData.quantity < 1) {
    showMessage('Preencha todos os campos corretamente.', 'error');
    return;
  }

  const saleId = saleIdInput.value;
  if (saleId) {
    await saveSale(saleData, 'PUT', `/api/sales/${saleId}`);
  } else {
    await saveSale(saleData, 'POST', '/api/sales');
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
    const id = editButton.dataset.id;
    form.sellerName.value = editButton.dataset.seller;
    form.customerName.value = editButton.dataset.customer;
    form.customerAddress.value = editButton.dataset.address;
    form.quantity.value = editButton.dataset.qty;
    saleIdInput.value = id;
    submitButton.textContent = 'Atualizar Venda';
    cancelButton.classList.remove('hidden');
    showMessage('Modo de edição ativado. Atualize os dados ou cancele.', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (deleteButton) {
    const id = deleteButton.dataset.id;
    const confirmed = confirm('Deseja realmente deletar esta venda?');
    if (!confirmed) return;

    const response = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
    if (response.ok) {
      resetForm();
      await loadData();
      showMessage('Venda deletada com sucesso!');
    } else {
      showMessage('Erro ao deletar venda.', 'error');
    }
  }

  if (deliverButton) {
    const id = deliverButton.dataset.id;
    const response = await fetch(`/api/sales/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'entregue' }),
    });

    if (response.ok) {
      await loadData();
      showMessage('Pedido marcado como entregue!');
    } else {
      showMessage('Erro ao marcar como entregue.', 'error');
    }
  }
});

const clearHistoryBtn = document.getElementById('clear-history-btn');
clearHistoryBtn.addEventListener('click', async () => {
  const confirmed = confirm('Deseja realmente deletar TODO o histórico de vendas? Esta ação é irreversível!');
  if (!confirmed) return;

  const finalConfirm = confirm('ATENÇÃO: Todos os dados serão permanentemente deletados. Tem certeza?');
  if (!finalConfirm) return;

  const response = await fetch('/api/sales/clean/all', { method: 'DELETE' });
  if (response.ok) {
    resetForm();
    await loadData();
    showMessage('Histórico de vendas deletado com sucesso!');
  } else {
    showMessage('Erro ao deletar histórico.', 'error');
  }
});

window.addEventListener('load', () => {
  loadData();
});
