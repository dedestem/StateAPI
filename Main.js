const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const si = require('systeminformation');

const app = express();
const port = 5000;

// Helper functie om bytes naar GB te converteren
function bytesToGB(bytes) {
    return (bytes / (1024 ** 3)).toFixed(2); // Omrekenen naar GB en afronden op 2 decimalen
}

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

    // Functie om RAM-gebruik te krijgen in GB
    app.get('/ram', async (req, res) => {
        try {
            const memory = await si.mem();
            res.json({
                total: bytesToGB(memory.total),    // Totale RAM in GB
                used: bytesToGB(memory.used),      // Gebruikte RAM in GB
                free: bytesToGB(memory.free)       // Vrije RAM in GB
            });
        } catch (error) {
            console.error('Error fetching RAM usage:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Functie om schijfgrootte en gebruik te krijgen in GB
    app.get('/disk', async (req, res) => {
        try {
            const diskUsage = await si.fsSize();

            // Neem de eerste schijf als voorbeeld
            const disk = diskUsage[0];

            res.json({
                total: bytesToGB(disk.size),           // Totale schijfgrootte in GB
                used: bytesToGB(disk.used),            // Gebruikte schijfruimte in GB
                available: bytesToGB(disk.available),  // Beschikbare schijfruimte in GB
                percentageUsed: disk.use               // Percentage gebruikt
            });
        } catch (error) {
            console.error('Error fetching disk usage:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    // Functie om actieve processen netjes te krijgen
    app.get('/processes', async (req, res) => {
        try {
            const processes = await si.processes();

            // Alleen relevante informatie weergeven in een nette lijst
            const processList = processes.list.map(proc => ({
                pid: proc.pid,           // Proces ID
                user: proc.user,         // Gebruiker die het proces uitvoert
                cpu: proc.pcpu.toFixed(2),  // CPU-gebruik in percentage
                memory: proc.pmem.toFixed(2), // Geheugengebruik in percentage
                command: proc.command    // Commando dat het proces uitvoert
            }));

            res.json(processList);
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
