const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
const port = 5000;

// CORS options
const corsOptions = {
    origin: ['https://davidnet.net'], // Replace with your allowed domains
    optionsSuccessStatus: 200 // For legacy browser support
};

// Enable CORS for specified origins
app.use(cors(corsOptions));

// Function to get RAM Usage
app.get('/ram', (req, res) => {
    exec('free -m', (err, stdout) => {
        if (err) return res.status(500).send(err);
        
        const lines = stdout.trim().split('\n');
        const memory = lines[1].trim().split(/\s+/);
        
        const totalMemory = memory[1]; // Total memory in MB
        const usedMemory = memory[2]; // Used memory in MB
        const freeMemory = memory[3]; // Free memory in MB
        
        res.json({
            total: totalMemory,
            used: usedMemory,
            free: freeMemory,
        });
    });
});

// Function to get Disk Size
app.get('/disk', (req, res) => {
    exec('df /path/to/ramdisk --output=size,used', (err, stdout) => {
        if (err) return res.status(500).send(err);
        
        const lines = stdout.trim().split('\n');
        const [max, used] = lines[1].trim().split(' ').map(Number);
        
        res.json({
            max: max, // Max size in KB
            used: used, // Used size in KB
        });
    });
});

// Function to get Running Processes
app.get('/processes', (req, res) => {
    exec('ps aux', (err, stdout) => {
        if (err) return res.status(500).send(err);
        res.send(stdout);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
