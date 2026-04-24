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
