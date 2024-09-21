const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fetch = require('node-fetch');

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
        return null; // Fallback als er een fout optreedt
    }
}

(async () => {
    const externalIP = await getExternalIP();
    
    // CORS options
    const corsOptions = {
        origin: externalIP ? [externalIP, 'https://davidnet.net'] : ['https://davidnet.net'], // Vervang door je toegestane domeinen
        optionsSuccessStatus: 200 // Voor legacy browser support
    };

    // Enable CORS for specified origins
    app.use(cors(corsOptions));

    // Functie om RAM-gebruik te krijgen
    app.get('/ram', (req, res) => {
        exec('free -m', (err, stdout) => {
            if (err) {
                console.error('Error fetching RAM usage:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            const lines = stdout.trim().split('\n');
            const memory = lines[1].trim().split(/\s+/);

            const totalMemory = memory[1]; // Totale geheugen in MB
            const usedMemory = memory[2]; // Gebruikt geheugen in MB
            const freeMemory = memory[3]; // Vrij geheugen in MB

            console.log(`RAM Usage - Total: ${totalMemory} MB, Used: ${usedMemory} MB, Free: ${freeMemory} MB`);
            
            res.json({
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
            });
        });
    });

    // Functie om schijfgrootte en gebruik te krijgen
    app.get('/disk', (req, res) => {
        exec('df -h /path/to/ramdisk --output=size,used,avail,pcent', (err, stdout) => {
            if (err) {
                console.error('Error fetching disk usage:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            const lines = stdout.trim().split('\n');
            const [size, used, avail, pcent] = lines[1].trim().split(' ');

            console.log(`Disk Usage - Total: ${size}, Used: ${used}, Available: ${avail}, Percentage Used: ${pcent}`);
            
            res.json({
                total: size,  // Totale schijfgrootte
                used: used,   // Gebruikte schijfruimte
                available: avail, // Beschikbare schijfruimte
                percentageUsed: pcent, // Percentage gebruikt
            });
        });
    });

    // Functie om actieve processen te krijgen
    app.get('/processes', (req, res) => {
        exec('ps aux', (err, stdout) => {
            if (err) {
                console.error('Error fetching processes:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            
            console.log('Fetched active processes');
            res.send(stdout);
        });
    });

    // Start de server
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
})();
