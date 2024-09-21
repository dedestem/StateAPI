const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const si = require('systeminformation');

const app = express();
const port = 5000;

// Detecteer extern IP-adres
async function getExternalIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching external IP:', error);
        return null;
    }
}

(async () => {
    const externalIP = await getExternalIP();

    // CORS opties
    const corsOptions = {
        origin: externalIP ? [externalIP, 'https://davidnet.net'] : ['https://davidnet.net'],
        optionsSuccessStatus: 200,
    };

    // Schakel CORS in voor gespecificeerde oorsprongen
    app.use(cors(corsOptions));

    // Functie om RAM-gebruik te krijgen
    app.get('/ram', async (req, res) => {
        try {
            const memory = await si.mem();
            res.json({
                total: memory.total,
                used: memory.used,
                free: memory.free,
            });
        } catch (error) {
            console.error('Error fetching RAM usage:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Functie om schijfgrootte en gebruik te krijgen
    app.get('/disk', async (req, res) => {
        try {
            const disks = await si.blockDrives();
            const diskUsage = await si.fsSize();

            // Neem de eerste schijf als voorbeeld
            const { size, used, available, use } = diskUsage[0];

            res.json({
                total: size,
                used: used,
                available: available,
                percentageUsed: use,
            });
        } catch (error) {
            console.error('Error fetching disk usage:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Functie om actieve processen te krijgen
    app.get('/processes', async (req, res) => {
        try {
            const processes = await si.processes();
            res.json(processes.list);
        } catch (error) {
            console.error('Error fetching processes:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Start de server
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
})();
