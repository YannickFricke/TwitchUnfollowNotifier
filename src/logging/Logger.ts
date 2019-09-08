import { createLogger, format, transports } from 'winston';

const defaultFormat = format.combine(
    format.colorize(),
    format.timestamp({
        format: 'DD.MM.YYYY HH:mm:ss',
    }),
    format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
);

export default createLogger({
    format: defaultFormat,
    level: 'debug',
    transports: [
        new transports.Console(),
    ],
});