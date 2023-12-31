const Peer = window.Peer;

(async function main() {
  //const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const getRoomModeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'mesh');

  roomMode.textContent = getRoomModeByHash();
  window.addEventListener(
    'hashchange',
    () => (roomMode.textContent = getRoomModeByHash())
  );

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  /*localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);
  */

  unityInstance.SendMessage('test', 'testlog');
  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({
    key: 'f1b2a635-fca4-4150-8104-d54dfeaec4bd',
    debug: 3,
  }));
  
  // Register join handler
  joinTrigger.addEventListener('click', () => { StartRoom(); });
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
  function StartRoom(){
    if (!peer.open) {
      console.error("peerがありません");
      return;
    }
    
    const room = peer.joinRoom("hoge", {
      mode: 'sfu',
      stream: localStream,
    });

    room.once('open', () => {
      messages.textContent += '=== You joined ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    
    //各peerのvideoを格納する連想配列
    const videoTrackMap={};
    const audioTrackMap={};
    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      //videoトラックとaudioトラックを格納
      const id=stream.peerId;
      console.log(id);
      videoTrackMap[id]=stream.getVideoTracks()[0];
      audioTrackMap[id]=stream.getAudioTracks()[0];

      const newVideoTrack= videoTrackMap[id];
      const newAudioTrack=audioTrackMap[id];
      const newStream=new MediaStream();
      if(newVideoTrack){
        newStream.addTrack(newVideoTrack);
        newStream.addTrack(newAudioTrack);
      }else{
        console.log("ビデオトラックが見つかりません");
      }

      const newVideo = document.createElement('video');
      newVideo.srcObject = newStream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    function onClickSend() {
      // Send message to all of the peers in the room via websocket
      room.send(localText.value);

      messages.textContent += `${peer.id}: ${localText.value}\n`;
      localText.value = '';
    }
  }

  peer.on('error', console.error);
})();
