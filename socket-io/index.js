// now the logs logging will be done here
// for real time logging, redis and socket io will be used
// here we will subscribe to the redis channel and emit the logs to the client
const { Server } = require('socket.io');
const { Redis } = require('ioredis');

const { config } = require('../config');
const { REDIS_AIVEN_URL, SOCKET_SERVER_PORT } = config;

// to let client from any origin to connect
const io = new Server({ cors: '*' })
const subscriber = new Redis(REDIS_AIVEN_URL);

io.on('connection', (socket) => {
    socket.on('subscribe', (channel) => {
        socket.join(channel);
        console.log('Subscribed to channel:', channel);
        socket.emit('message', `Subscribed to channel: ${channel}`);
    });
});

const initSubscribeToLogs = async () => {
    await subscriber.psubscribe('logs:*');

    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message);
    });
};


io.listen(SOCKET_SERVER_PORT, () => {
    console.log(`Socket server running on port ${SOCKET_SERVER_PORT}`);
});

initSubscribeToLogs();