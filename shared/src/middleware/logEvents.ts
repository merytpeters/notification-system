import { Injectable, NestMiddleware } from '@nestjs/common';

const { format } = require('date-fns');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

const logEvents = async (message: string, logName: string) => {
    const dateTime = `${format(new Date(), 'yyyyMMdd\tHH:mm:ss')}`;
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    try {
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'));
        }

        await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logName), logItem);
    } catch (err) {
        console.log(err);
    }
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: any, res: any, next: () => void) {
        logEvents(`${req.method}\t${req.headers.origin}\t${req.url}`, 'reqLog.txt');
        console.log(`${req.method} ${req.url}`);
        next();
    }
}

export { logEvents };