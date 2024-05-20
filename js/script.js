var params = new URLSearchParams(window.location.search);
if (params.get("p") != null) {
  console.log(params.get("p"));
  fetch("https://api.pastes.dev/" + params.get("p")).then((resp) => {
    resp.text().then((text) => {
      document.getElementById("code").value = text;
      console.log(text);
      const [decodedName, decodedTrack] = decodeTrackCode(text);

      console.log(decodedName);
      console.log(decodedTrack);
      //getLeaderboard(text);
    });
  });
}

async function getLeaderboard(code) {
  code = await sha256(code);

  //sha256 not working, plus cors errors
  //TODO: chore:  cors proxy + investigate hashing
  const resp = await fetch(
    `https://vps.kodub.com:43273/leaderboard?version=0.3.1&trackId=${code}&skip=0&amount=20`,
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,es;q=0.8",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      },
      referrer: "https://app-polytrack.kodub.com/",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "omit",
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
