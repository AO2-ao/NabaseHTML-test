
const Peer=window.Peer;
(async function main() {
  const remoteVideo = document.getElementById('remote-video');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');
  const joinTrigger = document.getElementById('js-join-trigger');
  const localVideo = document.getElementById('js-local-video');
  //peer初期化、webページが呼び出されたらすぐに初期化する
  const peer =(window.Peer= new Peer( {
    key:   "f1b2a635-fca4-4150-8104-d54dfeaec4bd",
    debug: 3,
  }));

  peer.on("open", (id) => {
    console.log(id);
  });

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();
  //送信するmediaStreamを取得する
  //※開発時間無いから既定のカメラとマイクを使用
  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  await navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      devices.forEach((device) => {
        console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
      });
    })
    .catch((err) => {
      console.error(`${err.name}: ${err.message}`);
    });
  
  //※一旦確認用で表示させる
  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  let room;
  joinTrigger.addEventListener('click', () => {
      room = peer.joinRoom("hogefuga", {
      mode: 'sfu',
      stream: localStream,
    });
  })
  room.on("open", () => {
    console.log("Room open");
  });
  //各peerのvideoを格納する連想配列
  const videoTrackMap={};
  room.on("stream", async stream => {
    console.log(stream.peerid);
    videoTrackMap[stream.peerid]=stream.getVideoTracks()[0];

    //試しに表示する
    const videoTrack= videoTrackMap[stream.peerid];
    const newRemoteMediaStream=new MediaStream();
    if (videoTrack) {
      newRemoteMediaStream.addTrack(videoTrack);
  } else {
      console.log("指定したビデオトラックが見つかりません。");
  }
      const newVideo = document.createElement('video');
      newVideo.srcObject = newRemoteMediaStream;
      newVideo.playsInline = true;
      remoteVideo.append(newVideo);
      await newVideo.play().catch(console.error);
  });
})();
