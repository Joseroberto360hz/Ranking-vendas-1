const express = require('express');
const { sequelize } = require('../db');
const Sale = require('../models/Sale');

const router = express.Router();

router.post('/sales', async (req, res) => {
  try {
    const { sellerName, customerName, customerAddress, quantity } = req.body;

    if (!sellerName || !customerName || !customerAddress || !quantity) {
      return res.status(400).json({ error: 'Informe todos os campos: sellerName, customerName, customerAddress, quantity.' });
    }

    const sale = await Sale.create({
      sellerName,
      customerName,
      customerAddress,
      quantity: Number(quantity),
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar a venda.' });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const sales = await Sale.findAll({ order: [['createdAt', 'DESC']] });
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar vendas.' });
  }
});

router.delete('/sales/clean/all', async (req, res) => {
  try {
    await Sale.destroy({ where: {} });
    res.status(200).json({ message: 'Histórico de vendas deletado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao limpar histórico de vendas.' });
  }
});

router.delete('/ranking/all', async (req, res) => {
  try {
    await Sale.update({ isActive: false }, { where: {} });
    res.status(200).json({ message: 'Ranking deletado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar o ranking.' });
  }
});

router.put('/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerName, customerName, customerAddress, quantity } = req.body;

    if (!sellerName || !customerName || !customerAddress || !quantity) {
      return res.status(400).json({ error: 'Informe todos os campos: sellerName, customerName, customerAddress, quantity.' });
    }

    const sale = await Sale.findByPk(id);
    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada.' });
    }

    await sale.update({
      sellerName,
      customerName,
      customerAddress,
      quantity: Number(quantity),
    });

    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar a venda.' });
  }
});

router.delete('/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findByPk(id);
    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada.' });
    }

    await sale.destroy();
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar a venda.' });
  }
});

router.patch('/sales/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pendente', 'entregue'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use "pendente" ou "entregue".' });
    }

    const sale = await Sale.findByPk(id);
    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada.' });
    }

    await sale.update({ status });
    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar status da venda.' });
  }
});

router.get('/ranking', async (req, res) => {
  try {
    const ranking = await Sale.findAll({
      attributes: [
        'sellerName',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      ],
      where: { isActive: true },
      group: ['sellerName'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      raw: true,
    });

    const ranked = ranking.map((row, index) => ({
      rank: index + 1,
      sellerName: row.sellerName,
      totalQuantity: Number(row.totalQuantity),
    }));

    res.json(ranked);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao montar ranking.' });
  }
});

module.exports = router;
