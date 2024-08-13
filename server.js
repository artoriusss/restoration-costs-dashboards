import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the Kyiv dashboard
app.get('/kyiv', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/kyiv/index.html'));
});

// Serve the Ukraine dashboard
app.get('/ukraine', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ukraine/index.html'));
});

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; // Ensure listening on all network interfaces
app.listen(PORT, HOST, () => {
  console.log(`App listening on http://${HOST}:${PORT}`);
});
