let divSelectRoom = document.getElementById('selectRoom');
let divConsultingRoom = document.getElementById('consultingRoom');
const buttonGoRoom = document.getElementById('goRoom');
const inputRoomNumber = document.getElementById('roomNumber');
let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');

let inputCallName = document.getElementById('inputCallName');
let buttonSetName = document.getElementById('buttonSetName');
let headingCallName = document.getElementById('callName');
let texta= document.getElementById('messagea')
let textatwo= document.getElementById('mtwo');
let messagearr=[];
let m2arr=[];
let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller, dataChannel;
const iceServers = {
  'iceServer': [
    { 'urls': 'stun:stun.services.mozilla.com' },
    { 'urls': 'stun:stun.l.google.com:19302' }
  ]
}
  var streamConstraints = {
    audio: true,
    video: true
  } 
const socket = io();
buttonGoRoom.onclick = async function() {
  if (!inputRoomNumber.value) {
    alert('please enter room name');
  } else {
    roomNumber = inputRoomNumber.value;
    socket.emit('create or join', roomNumber);
    divSelectRoom.style = 'display: none';
    divConsultingRoom.style = 'display: block';
  }
}
buttonSetName.onclick = async function () {
  if (!inputCallName.value) {
    alert('please enter a valid message');
  } else {
    messagearr.push(inputCallName.value);
    dataChannel.send(inputCallName.value);
    para=document.createElement('h2')
    para.innerHTML=messagearr[(messagearr.length)-1];
    texta.appendChild(para);
  }
}

socket.on('created', async function (room) {
  localStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
  localVideo.srcObject = localStream;
  isCaller = true;
});

socket.on('joined', async function (room) {
  localStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
  localVideo.srcObject = localStream;
  socket.emit('ready', roomNumber);
});

socket.on('ready', async function (room) {
  if (isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onicecandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    dataChannel = rtcPeerConnection.createDataChannel(roomNumber);
    const sdp = await rtcPeerConnection.createOffer();
    rtcPeerConnection.setLocalDescription(sdp);
    socket.emit('offer', {
      type: 'offer',
      sdp: sdp,
      room: roomNumber,
    });
   
  dataChannel.onmessage = ((event) => { 
      let msg=document.createElement('h2')
      msg.innerHTML=event.data;
      textatwo.appendChild(msg); 
    }) 
  }
});
socket.on('offer', async function (event) {
  if (!isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onicecandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    
    const sdp = await rtcPeerConnection.createAnswer();
    rtcPeerConnection.setLocalDescription(sdp);
    socket.emit('answer', {
      type: 'answer',
      sdp: sdp,
      room: roomNumber,
    });
    rtcPeerConnection.ondatachannel = event => {
      dataChannel = event.channel;
      dataChannel.onmessage = event => {
        let msg12=document.createElement('h2')
      msg12.innerHTML=event.data;
      textatwo.appendChild(msg12); 
        }
    };

  }
});

socket.on('candidate',  function (event) {
  console.log('received candidate event', event)
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.lable,
    candidate: event.candidate.candidate,
    sdpMid: event.id,
  });
  
  rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('answer', async function (event) {
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

function onAddStream(event) {
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
}

function onicecandidate(event) {
  if(event.candidate) {
    console.log(`sending ice candidate`, event.candidate);
    const outgoing = {
      type: 'candidate',
      lable: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate,
      room: roomNumber
    }
    console.log(outgoing)
    socket.emit('candidate', outgoing);
  }
}

 