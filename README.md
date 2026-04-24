{
  "name": "share-site",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1"
  }
}const express = require('express');
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
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مشاركة فيديوهات وصور - مثل ShareIt</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 900px;
            margin: auto;
            background: white;
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        h1 {
            text-align: center;
            color: #333;
        }
        .share-box {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
        }
        input, select, button {
            padding: 10px;
            margin: 5px;
            border-radius: 8px;
            border: 1px solid #ddd;
            font-size: 16px;
        }
        button {
            background: #667eea;
            color: white;
            cursor: pointer;
            border: none;
            transition: 0.3s;
        }
        button:hover {
            background: #5a67d8;
        }
        .media-container {
            background: #000;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
            text-align: center;
        }
        video, img {
            max-width: 100%;
            max-height: 500px;
            width: auto;
            margin: auto;
            display: block;
        }
        .controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        .status {
            text-align: center;
            color: #666;
            margin-top: 10px;
            font-size: 14px;
        }
        input[type="range"] {
            width: 200px;
        }
        @media (max-width: 600px) {
            .share-box input, .share-box select {
                width: calc(100% - 20px);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 مشاركة فيديوهات وصور</h1>
        <p style="text-align:center">✨ أي جهاز يفتح هذا الرابط سيشاهد نفس المحتوى</p>

        <div class="share-box">
            <h3>➕ شارك ميديا جديدة:</h3>
            <select id="mediaType">
                <option value="video">فيديو</option>
                <option value="image">صورة</option>
            </select>
            <input type="text" id="mediaUrl" placeholder="الرابط (URL)" size="40">
            <button id="shareBtn">📤 مشاركة</button>
            <div class="status">💡 مثال فيديو: https://www.w3schools.com/html/mov_bbb.mp4<br>
            💡 مثال صورة: https://picsum.photos/800/400</div>
        </div>

        <div class="media-container" id="mediaContainer">
            <div style="color:white; padding:50px; text-align:center;">⏳ انتظر مشاركة محتوى...</div>
        </div>

        <div class="controls">
            <button id="playBtn">▶️ تشغيل</button>
            <button id="pauseBtn">⏸️ إيقاف</button>
            <input type="range" id="seekBar" min="0" max="100" value="0">
        </div>
        <div class="status" id="connectionStatus">🟢 متصل بالخادم...</div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script src="/script.js"></script>
</body>
</html>
const socket = io();
let currentVideo = null;
let isSeeking = false;

const mediaContainer = document.getElementById('mediaContainer');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const seekBar = document.getElementById('seekBar');
const shareBtn = document.getElementById('shareBtn');
const mediaType = document.getElementById('mediaType');
const mediaUrl = document.getElementById('mediaUrl');
const statusDiv = document.getElementById('connectionStatus');

// استقبال ميديا من أي جهاز آخر
socket.on('load-media', (data) => {
    console.log('تم استلام:', data);
    displayMedia(data.type, data.url);
});

// استقبال أوامر التحكم
socket.on('control', (action) => {
    if (action.type === 'play') {
        if (currentVideo) currentVideo.play();
    } else if (action.type === 'pause') {
        if (currentVideo) currentVideo.pause();
    } else if (action.type === 'seek' && currentVideo) {
        currentVideo.currentTime = action.value;
    }
});

// عرض الصورة أو الفيديو
function displayMedia(type, url) {
    if (!url) return;
    mediaContainer.innerHTML = '';
    if (type === 'video') {
        const video = document.createElement('video');
        video.src = url;
        video.controls = false;
        video.style.width = '100%';
        video.autoplay = false;
        video.addEventListener('loadedmetadata', () => {
            seekBar.max = video.duration;
        });
        video.addEventListener('timeupdate', () => {
            if (!isSeeking && video.duration) {
                seekBar.value = video.currentTime;
            }
        });
        mediaContainer.appendChild(video);
        currentVideo = video;
    } else if (type === 'image') {
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        mediaContainer.appendChild(img);
        currentVideo = null; // لا يوجد فيديو للصورة
    }
}

// مشاركة ميديا جديدة
shareBtn.addEventListener('click', () => {
    const type = mediaType.value;
    const url = mediaUrl.value.trim();
    if (!url) {
        alert('الرجاء إدخال رابط صحيح');
        return;
    }
    // إرسال للخادم (الخادم سيبثه للآخرين)
    socket.emit('share-media', { type, url });
    // عرضها عند المرسل أيضاً
    displayMedia(type, url);
    mediaUrl.value = '';
});

// أوامر التحكم
playBtn.addEventListener('click', () => {
    if (currentVideo) {
        currentVideo.play();
        socket.emit('control', { type: 'play' });
    }
});

pauseBtn.addEventListener('click', () => {
    if (currentVideo) {
        currentVideo.pause();
        socket.emit('control', { type: 'pause' });
    }
});

seekBar.addEventListener('input', (e) => {
    if (currentVideo) {
        isSeeking = true;
        const val = parseFloat(e.target.value);
        socket.emit('control', { type: 'seek', value: val });
        currentVideo.currentTime = val;
    }
});

seekBar.addEventListener('change', () => {
    isSeeking = false;
});

// حالة الاتصال
socket.on('connect', () => {
    statusDiv.innerHTML = '🟢 متصل - أي مشاركة ستظهر لجميع الأجهزة';
    statusDiv.style.color = 'green';
});
socket.on('disconnect', () => {
    statusDiv.innerHTML = '🔴 انقطع الاتصال.refresh الصفحة';
    statusDiv.style.color = 'red';
});
