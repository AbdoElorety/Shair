const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

let currentMedia = {
    type: null, // 'video' or 'image'
    url: null,
    timestamp: 0
};

io.on('connection', (socket) => {
    console.log('جهاز جديد متصل:', socket.id);

    // إرسال الميديا الحالية للجهاز الجديد
    if (currentMedia.url) {
        socket.emit('load-media', currentMedia);
    }

    // استقبال مشاركة ميديا جديدة
    socket.on('share-media', (data) => {
        currentMedia = {
            type: data.type,
            url: data.url,
            timestamp: Date.now()
        };
        // بث لكل الأجهزة الأخرى
        socket.broadcast.emit('load-media', currentMedia);
    });

    // التحكم (تشغيل/إيقاف/تقدم)
    socket.on('control', (action) => {
        socket.broadcast.emit('control', action);
    });

    socket.on('disconnect', () => {
        console.log('جهاز disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`الموقع شغال على http://localhost:${PORT}`);
});
