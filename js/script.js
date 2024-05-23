var params = new URLSearchParams(window.location.search);
if (params.get("p") != null) {
  console.log(params.get("p"));
  fetch("https://api.pastes.dev/" + params.get("p")).then((resp) => {
    resp.text().then((text) => {
      document.getElementById("code").value = text;
      console.log(text);
      //const [decodedName, decodedTrack] = decodeTrackCode(text);

      //console.log(decodedName);
      //console.log(decodedTrack);
      getLeaderboard(text);
    });
  });
}

async function getLeaderboard(code) {
  code = await sha256(code);

  //CORS errors still present

  //sha256 not working
  //TODO: chore: investigate hashing
  const resp = await fetch(
    `https://corsproxy.io?${encodeURIComponent("https://vps.kodub.com:43273/leaderboard?version=0.3.1&trackId=${code}&skip=0&amount=20")}`,
    {
      method: "GET"
    }
  );
  const json = await resp.json();

  document.getElementById("leaderboard").innerText = json;
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
