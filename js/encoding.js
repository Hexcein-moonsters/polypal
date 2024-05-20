//track encoding ported back to js by @jblitzar

const base62 = {
  t: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  i: [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1,
    -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29,
    30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
    49, 50, 51,
  ],
  n: function (e, t) {
    if (t >= 8 * e.length) throw new Error("Out of range");
    var i = t / 8,
      n = e[Math.floor(i)],
      r = t - 8 * i;
    if (r <= 2 || i >= e.length - 1) return (n >> r) & 63;
    return (
      ((n >> r) & 63) | ((e[Math.floor(i) + 1] & (63 >> (8 - r))) << (8 - r))
    );
  },
  r: function (e, t, i, n, r) {
    for (var s = t / 8; e.length <= s; ) e.push(0);
    var a = t - 8 * s;
    e[Math.floor(s)] |= (n << a) & 255;
    if (a > 8 - i && !r) {
      t = s + 1;
      if (e.length <= t) e.push(0);
      e[Math.floor(t)] |= n >> (8 - a);
    }
  },
  encode: function (e) {
    for (var t = 0, i = ""; t < 8 * e.length; ) {
      var n = this.n(e, t);
      var s = 30 === (30 & n) ? 31 & n : n;
      t += 30 === (30 & n) ? 5 : 6;
      i += this.t[s];
    }
    return i;
  },
  decode: function (e) {
    for (var t = 0, i = [], n = e.length, s = 0; s < n; s++)
      var a = e.charCodeAt(s), o = this.i[a];
    console.log(a);
    if (-1 === o) return console.error(a), null;
    var l = 30 === (30 & o) ? 5 : 6;
    this.r(i, t, l, o, s === n - 1);
    t += l;

    return i;
  },
};

// Convert track code to JavaScript
function genTrackCode(trackName, trackPieces) {
  // Track data -> binary -> zlib (compression level 9) -> base62 encoding

  let trackBytes = new Uint8Array();

  for (const [partId, parts] of Object.entries(trackPieces)) {
    trackBytes = Uint8Array.from([
      ...trackBytes,
      ...new Uint8Array(partId),
      ...new Uint8Array(parts.length),
    ]);
    for (const part of parts) {
      for (const key of ["x", "y", "z"]) {
        let val = part[key];
        if (["x", "z"].includes(key)) {
          val += Math.pow(2, 23);
        }
        trackBytes = Uint8Array.from([...trackBytes, ...new Uint8Array(val)]);
      }
      trackBytes = Uint8Array.from([
        ...trackBytes,
        ...new Uint8Array(part["r"]),
      ]);
      if (part.hasOwnProperty("ckpt") && part["ckpt"] !== null) {
        trackBytes = Uint8Array.from([
          ...trackBytes,
          ...new Uint8Array(part["ckpt"]),
        ]);
      }
    }
  }

  const compressedTrack = pako.deflate(trackBytes, { level: 9 });

  const p1 = base62.encode([trackName.length]);
  const p2 = base62.encode([...trackName].map((char) => char.charCodeAt(0)));
  const p3 = base62.encode(compressedTrack);

  const encodedTrack = "v2" + p1 + p2 + p3;
  return encodedTrack;
}

// Convert track code back to JavaScript
function decodeTrackCode(trackCode) {
  // Exclude "v2"
  trackCode = trackCode.slice(2);

  // zlib header 0x78DA is always encoded to "4p" and then other stuff
  // if it is not present then track code bork
  const tdStart = trackCode.indexOf("4p");
  if (tdStart === -1) {
    throw new Error("Invalid track code");
  }

  const nameData = trackCode.slice(0, tdStart);
  const trackData = trackCode.slice(tdStart);

  const nameLen = base62.decode(nameData.slice(0, 2));
  const name = String.fromCharCode(...base62.decode(nameData.slice(2)));
  if (name === null || nameLen === null || nameLen[0] !== name.length) {
    throw new Error("Failed to decode track name");
  }

  const tdDecoded = base62.decode(trackData);
  if (tdDecoded === null) {
    throw new Error("Failed to decode track data");
  }

  const tdBin = pako.inflate(new Uint8Array(tdDecoded));
  const track = {};

  let pos = 0;
  while (pos < tdBin.length) {
    const partId = tdBin[pos];
    const partN =
      tdBin[pos + 1] |
      (tdBin[pos + 2] << 8) |
      (tdBin[pos + 3] << 16) |
      (tdBin[pos + 4] << 24);
    pos += 5;
    track[partId] = [];
    for (let i = 0; i < partN; i++) {
      const x =
        (tdBin[pos] | (tdBin[pos + 1] << 8) | (tdBin[pos + 2] << 16)) -
        Math.pow(2, 23);
      const y = tdBin[pos + 3] | (tdBin[pos + 4] << 8) | (tdBin[pos + 5] << 16);
      const z =
        (tdBin[pos + 6] | (tdBin[pos + 7] << 8) | (tdBin[pos + 8] << 16)) -
        Math.pow(2, 23);
      const r = tdBin[pos + 9];
      let ckpt = null;
      if (cpIds.includes(partId)) {
        ckpt = tdBin[pos + 10] | (tdBin[pos + 11] << 8);
        pos += 12;
      } else {
        pos += 10;
      }
      track[partId].push({ x: x, y: y, z: z, r: r, ckpt: ckpt });
    }
  }

  return [name, track];
}
