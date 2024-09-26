const express = require('express');
const os = require('os');
const disk = require('diskusage');
const Docker = require('dockerode'); // Dockerode importeren
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios'); // Vergeet niet axios te importeren

const app = express();
const PORT = 5000;

// Docker instantie maken
const docker = new Docker();

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

// Functie om het batterijpercentage op te halen
function getBatteryPercentage() {
  return new Promise((resolve, reject) => {
    exec("acpi -b", (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

      const match = stdout.match(/(\d+)%/);
      if (match) {
        resolve(parseInt(match[1], 10));
      } else {
        reject(new Error('Could not parse battery percentage'));
      }
    });
  });
}

// Battery Endpoint
app.get('/battery', async (req, res) => {
  try {
    const batteryPercentage = await getBatteryPercentage();
    res.json({ battery: batteryPercentage + '%' });
  } catch (error) {
    console.error('Error fetching battery percentage:', error);
    res.status(500).json({ error: 'Failed to get battery percentage' });
  }
});

// CPU INFO
app.get('/cpu-info', (req, res) => {
  const cpuInfo = os.cpus();
  res.json(cpuInfo);
});

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

// IP Address Endpoint
app.get('/ip', async (req, res) => {
    try {
        // Get internal IP address
        const interfaces = os.networkInterfaces();
        let internalIp = '';
        for (const iface of Object.values(interfaces)) {
            for (const addr of iface) {
                if (addr.family === 'IPv4' && !addr.internal) {
                    internalIp = addr.address;
                    break;
                }
            }
            if (internalIp) break;
        }

        // Make API request to your own check IP API
        const response = await axios.get('http://davidnet.net/API/MyIp.php'); // Update with actual IP or domain
        const externalIp = response.data.ip;

        // Send response
        res.send(`${internalIp}@${externalIp}`);
    } catch (error) {
        console.error('Error fetching external IP:', error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching IP addresses');
    }
});

// API endpoint om actieve Docker-containers op te halen
app.get('/active-containers', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: false }); // Haal alleen actieve containers op
    res.json(containers);
  } catch (err) {
    console.error("Error fetching active containers:", err);
    res.status(500).json({ error: 'Failed to get active containers' });
  }
});

// Test Endpoint
app.get('/active', async (req, res) => {
  try {
    res.json("Hello");
  } catch (err) {
    console.error("Error telling I'm online!", err);
    res.status(500).json({ error: 'Error telling I am online!' });
  }
});

// Nodes Endpoint
app.get('/nodes', (req, res) => {
    exec("ps aux | grep '[n]ode'", (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error}`);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const processes = stdout.split('\n').map(line => {
            const parts = line.trim().split(/\s+/);
            return {
                user: parts[0],
                pid: parts[1],
                command: parts.slice(10).join(' '),
            };
        }).filter(proc => proc.command); // Remove empty lines

        res.json(processes);
    });
});

// Speed Test Endpoint
app.get('/speedtest', (req, res) => {
  exec('speedtest-cli --json', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing speedtest: ${error}`);
      return res.status(500).json({ error: 'Failed to perform speed test' });
    }

    try {
      const result = JSON.parse(stdout);
      res.json({
        download: (result.download / (1024 ** 2)).toFixed(2) + ' Mbps', // Download snelheid in Mbps
        upload: (result.upload / (1024 ** 2)).toFixed(2) + ' Mbps',     // Upload snelheid in Mbps
        ping: result.ping + ' ms',                                      // Ping in ms
      });
    } catch (err) {
      console.error("Error parsing speedtest result:", err);
      res.status(500).json({ error: 'Failed to parse speed test result' });
    }
  });
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
