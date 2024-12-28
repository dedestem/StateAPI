//* 
// DN-Node
// 
// The core for Davidnet express api's
// https://github.com/dedestem/DN-Node/
// *\\

// Services
import Express from 'express';
import Helmet from 'helmet';

// Objects
export const Api = Express();
export let State = "Starting";
let Server = Api.listen(0);

// Configure
const DNNodeVersion = 1.5;
const MinimumInfoVersion = 1;
Api.use(Helmet());

// Modules
import { ReadJson, WriteJson } from './Utils.js';

// Collect information
(async () => {
    const Info = await ReadJson("./Info.json");
    if (Info.InfoVersion < MinimumInfoVersion) {
        State = "Outdated";
        console.error("Info outdated");
    }
    
    Info.Start = new Date().toISOString();
    WriteJson('./Info.json', Info);
})();

export async function RegisterNode(Port) {
    Api.get('/State', async (req, res) => {
        res.send(State);
    });

    Api.get('/Uptime', async (req, res) => {
        const uptime = await GetUptime(); // Assuming GetUptime will now handle async
        res.send(uptime);
    });

    Api.get('/Version', async (req, res) => {
        res.send(await GetVersion());
    });

    // 404 - Not Found
    Api.use((req, res, next) => {
        res.status(404).send('404 - Not Found');
    });

    // 500 - Internal Server Error
    Api.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });

    Server.close(() => {
        Server = Api.listen(Port, () => {
            console.log(`Server now running on port ${Port}`);
            State = "Healthy";
        });
    });
}

// Shutdown code!
process.on('SIGTERM', () => {
    console.debug('Server shutdown request received!');
    Server.close(() => {
        console.debug('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGHUP', () => {
    console.debug('Server shutdown request received!');
    Server.close(() => {
        console.debug('HTTP server closed');
        process.exit(0);
    });
});

//////////////////// END OF INIT CODE ///////////////////

export async function GetUptime() {
    const Info = await ReadJson("./Info.json");
    const UptimeMs = new Date() - new Date(Info.Start);

    const seconds = Math.floor(UptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const uptime = {
        days: days % 365,
        hours: hours % 24,
        minutes: minutes % 60,
        seconds: seconds % 60
    };
    return uptime;
}

export async function GetVersion() {
    const Info = await ReadJson("./Info.json");
    const Commit = Info.Commit;
    const InfoVersion = Info.InfoVersion;

    const Version = {
        DNNodeVersion: DNNodeVersion,
        MinimumInfoVersion: MinimumInfoVersion,
        Commit: Commit,
        InfoVersion: InfoVersion,
    };
    return Version;
}