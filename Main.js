const express = require('express');
const os = require('os');
const disk = require('diskusage');
const path = require('path');

const app = express();
const PORT = 5000;

// Functie om de laatste herstarttijd te krijgen
function getLastReboot() {
  const uptime = os.uptime(); // Uptime in seconden
  const currentTime = new Date();
  const rebootTime = new Date(currentTime - uptime * 1000);
  return rebootTime;
}

// Functie om schijfinformatie te krijgen voor Ubuntu (/ root pad)
async function getDiskUsage() {
  try {
    const { total, free } = await disk.check('/');
    const used = total - free;
    return {
      total: (total / (1024 ** 3)).toFixed(2) + ' GB', // Schijftotaal in GB
      free: (free / (1024 ** 3)).toFixed(2) + ' GB',   // Vrije ruimte in GB
      used: (used / (1024 ** 3)).toFixed(2) + ' GB',   // Gebruikte ruimte in GB
    };
  } catch (err) {
    console.error("Error fetching disk usage:", err);
    return null;
  }
}

// API endpoint om systeeminformatie op te halen
app.get('/system-info', async (req, res) => {
  const totalRam = (os.totalmem() / (1024 ** 3)).toFixed(2) + ' GB';
  const freeRam = (os.freemem() / (1024 ** 3)).toFixed(2) + ' GB';
  const usedRam = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(2) + ' GB';
  const lastReboot = getLastReboot();
  const diskUsage = await getDiskUsage();

  if (!diskUsage) {
    return res.status(500).json({ error: 'Failed to get disk usage' });
  }

  res.json({
    ram: {
      total: totalRam,
      free: freeRam,
      used: usedRam,
    },
    disk: diskUsage,
    lastReboot: lastReboot.toISOString(),
  });
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
