import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(__dirname));

// Serve the Kyiv dashboard
app.get('/kyiv', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/kyiv/index.html'));
});

// Serve the Ukraine dashboard
app.get('/ukraine', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/ukraine/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});