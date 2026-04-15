const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path');
const dotenv = require('dotenv');
const { sequelize } = require('./db');
const salesRouter = require('./routes/sales');

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
const publicUrl = process.env.PUBLIC_URL || '';
const trustProxy = String(process.env.TRUST_PROXY || 'false').toLowerCase() === 'true';
const configuredOrigins = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length ? configuredOrigins : ['*'];

function getCorsOptions() {
  if (allowedOrigins.includes('*')) {
    return { origin: true };
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origem nao permitida pelo CORS.'));
    },
  };
}

function getLocalNetworkUrls(currentPort) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((networkGroup) => {
    (networkGroup || []).forEach((network) => {
      if (network.family !== 'IPv4' || network.internal) {
        return;
      }

      urls.push(`http://${network.address}:${currentPort}`);
    });
  });

  return urls;
}

function getServerUrls(currentPort, currentHost) {
  const urls = publicUrl ? [publicUrl] : [`http://localhost:${currentPort}`];

  if (currentHost === '0.0.0.0' || currentHost === '::') {
    urls.push(...getLocalNetworkUrls(currentPort));
  } else if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    urls.push(`http://${currentHost}:${currentPort}`);
  }

  return [...new Set(urls)];
}

if (trustProxy) {
  app.set('trust proxy', 1);
}

app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', salesRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeInSeconds: Math.round(process.uptime()),
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint nao encontrado.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  console.error(error);

  if (req.path.startsWith('/api')) {
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'JSON invalido na requisicao.' });
      return;
    }

    if (error.message === 'Origem nao permitida pelo CORS.') {
      res.status(403).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    return;
  }

  res.status(500).send('Erro interno do servidor.');
});

sequelize.sync().then(() => {
  console.log('Banco sincronizado com MySQL');
  app.listen(port, host, () => {
    console.log('Servidor pronto para acesso em:');
    getServerUrls(port, host).forEach((url) => {
      console.log(`- ${url}`);
    });
  });
}).catch((error) => {
  console.error('Erro ao conectar com o banco:', error);
  process.exit(1);
});
