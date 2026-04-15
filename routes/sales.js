const express = require('express');
const Sale = require('../models/Sale');

const router = express.Router();
const VALID_STATUSES = {
  aberto: 'pendente',
  'em aberto': 'pendente',
  open: 'pendente',
  pendente: 'pendente',
  concluido: 'entregue',
  entregue: 'entregue',
  done: 'entregue',
  completed: 'entregue',
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function pickTextField(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function pickNumberField(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return Number.NaN;
}

function normalizeSalePayload(body = {}) {
  return {
    sellerName: pickTextField(body.sellerName, body.ownerName, body.personName, body.participantName),
    customerName: pickTextField(body.customerName, body.referenceName, body.contactName, body.subjectName),
    customerAddress: pickTextField(body.customerAddress, body.details, body.referenceDetails, body.location),
    quantity: pickNumberField(body.quantity, body.score, body.points, body.total),
  };
}

function isValidSalePayload(payload) {
  return Boolean(
    payload.sellerName
      && payload.customerName
      && payload.customerAddress
      && Number.isInteger(payload.quantity)
      && payload.quantity >= 1
  );
}

function normalizeStatus(status) {
  return VALID_STATUSES[normalizeText(status)] || null;
}

function serializeSale(sale) {
  const plainSale = typeof sale.get === 'function'
    ? sale.get({ plain: true })
    : sale;

  return {
    ...plainSale,
    ownerName: plainSale.sellerName,
    referenceName: plainSale.customerName,
    details: plainSale.customerAddress,
    score: Number(plainSale.quantity),
  };
}

function sendValidationError(res) {
  res.status(400).json({
    error: 'Informe sellerName, customerName, customerAddress e quantity. Tambem pode usar ownerName, referenceName, details e score.',
  });
}

function sendInternalError(res, error, message) {
  console.error(error);
  res.status(500).json({ error: message });
}

router.post('/sales', async (req, res) => {
  try {
    const payload = normalizeSalePayload(req.body);

    if (!isValidSalePayload(payload)) {
      return sendValidationError(res);
    }

    const sale = await Sale.create(payload);
    return res.status(201).json(serializeSale(sale));
  } catch (error) {
    return sendInternalError(res, error, 'Erro ao salvar o registro.');
  }
});

router.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.findAll({ order: [['createdAt', 'DESC']] });
    return res.json(sales.map(serializeSale));
  } catch (error) {
    return sendInternalError(res, error, 'Erro ao buscar os registros.');
  }
});

router.put('/sales/:id', async (req, res) => {
  try {
    const payload = normalizeSalePayload(req.body);

    if (!isValidSalePayload(payload)) {
      return sendValidationError(res);
    }

    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Registro nao encontrado.' });
    }

    await sale.update(payload);
    return res.json(serializeSale(sale));
  } catch (error) {
    return sendInternalError(res, error, 'Erro ao atualizar o registro.');
  }
});

router.delete('/sales/:id', async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Registro nao encontrado.' });
    }

    await sale.destroy();
    return res.status(204).send();
  } catch (error) {
    return sendInternalError(res, error, 'Erro ao excluir o registro.');
  }
});

router.patch('/sales/:id/status', async (req, res) => {
  try {
    const status = normalizeStatus(req.body?.status);
    if (!status) {
      return res.status(400).json({ error: 'Status invalido. Use pendente, aberto, concluido ou entregue.' });
    }

    const sale = await Sale.findByPk(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Registro nao encontrado.' });
    }

    await sale.update({ status });
    return res.json(serializeSale(sale));
  } catch (error) {
    return sendInternalError(res, error, 'Erro ao atualizar o status.');
  }
});

router.delete('/sales/clean/all', async (req, res) => {
  try {
    await Sale.destroy({ where: {} });
    return res.status(200).json({ message: 'Historico apagado com sucesso.' });
  } catch (error) {
    return sendInternalError(res, error, 'Erro ao limpar o historico.');
  }
});

router.delete('/ranking/all', async (req, res) => {
  try {
    await Sale.update({ isActive: false }, { where: {} });
    return res.status(200).json({ message: 'Ranking ocultado com sucesso.' });
  } catch (error) {
    return sendInternalError(res, error, 'Erro ao limpar o ranking.');
  }
});

router.get('/ranking', async (req, res) => {
  try {
    const ranking = await Sale.findAll({
      attributes: [
        'sellerName',
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('quantity')), 'totalQuantity'],
      ],
      where: { isActive: true },
      group: ['sellerName'],
      order: [[Sale.sequelize.fn('SUM', Sale.sequelize.col('quantity')), 'DESC']],
      raw: true,
    });

    const ranked = ranking.map((row, index) => ({
      rank: index + 1,
      sellerName: row.sellerName,
      totalQuantity: Number(row.totalQuantity),
      ownerName: row.sellerName,
      score: Number(row.totalQuantity),
    }));

    return res.json(ranked);
  } catch (error) {
    return sendInternalError(res, error, 'Erro ao montar o ranking.');
  }
});

module.exports = router;
