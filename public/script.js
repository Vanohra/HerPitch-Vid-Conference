const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
});

let myVideoStream;
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};

// Get access to video and audio
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  // Answer calls from other users
  myPeer.on('call', call => {
    call.answer(stream); // Answer the call with your stream
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream); // Display the caller's video stream
    });
    call.on('close', () => {
      video.remove(); // Remove the video when call ends
    });
  });

  // When a new user connects
  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream); // Call the new user and share your stream
  });

  // Chat functionality
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

// Handle user disconnection
socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close();
});

// When connected to the peer server, join the room
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
});

// Function to connect to a new user and add their video stream
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream); // Call the new user
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream); // Display the new user's video stream
  });
  call.on('close', () => {
    video.remove(); // Remove the video when call ends
  });

  peers[userId] = call; // Save the call in peers object
}

// Function to add video stream to the DOM
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

// Chat scroll
const scrollToBottom = () => {
  const d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
};

// Mute/Unmute function
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

// Play/Stop Video function
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

// UI updates for mute/unmute and play/stop
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
