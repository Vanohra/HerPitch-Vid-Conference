const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
});

let myVideoStream;
const myVideo = document.createElement('video');
myVideo.muted = true; // Mute own video to avoid echo
const peers = {};

// Access the user's video and audio
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream); // Display your own video

  // Answer incoming calls and add their video
  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  // When a new user connects, call them and add their video
  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream);
  });

  // Chat message handling
  let text = $("input");
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('');
    }
  });

  socket.on("createMessage", message => {
    $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
    scrollToBottom();
  });
});

// When a user disconnects, close their video stream
socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close();
});

// When connected to the peer server, emit join-room event
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

// Connect to a new user
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });

  peers[userId] = call; // Store the call for disconnection handling
}

// Add video stream to the video grid
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

// Chat auto-scroll
const scrollToBottom = () => {
  const d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
};

// Mute/Unmute functionality
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

// Play/Stop video functionality
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

// UI updates for Mute/Unmute and Play/Stop Video
const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
};
