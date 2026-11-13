/* Minimal ZIP writer (store only, no compression, no dependencies).
   RVN.zip.build([{path, data: Uint8Array | null}]) -> Uint8Array. A path ending in "/" with data null is a folder entry.
   Store-only is fine here: PNG/OGG/MP3 are already compressed and the text files are small. */
(function (R) {
  const table = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(bytes) { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = table[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  function build(files) {
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const entries = files.map(f => {
      const name = R.util.toBytes(f.path), data = f.data || new Uint8Array(0);
      return { name, data, crc: crc32(data), dir: !f.data, offset: 0 };
    });
    let size = 22;
    entries.forEach(e => { size += 30 + e.name.length + e.data.length + 46 + e.name.length; });
    const out = new Uint8Array(size), dv = new DataView(out.buffer);
    let p = 0;
    const u16 = (v) => { dv.setUint16(p, v, true); p += 2; }, u32 = (v) => { dv.setUint32(p, v, true); p += 4; };
    entries.forEach(e => {
      e.offset = p;
      u32(0x04034b50); u16(20); u16(0x0800); u16(0); u16(dosTime); u16(dosDate);
      u32(e.crc); u32(e.data.length); u32(e.data.length); u16(e.name.length); u16(0);
      out.set(e.name, p); p += e.name.length; out.set(e.data, p); p += e.data.length;
    });
    const cdStart = p;
    entries.forEach(e => {
      u32(0x02014b50); u16(20); u16(20); u16(0x0800); u16(0); u16(dosTime); u16(dosDate);
      u32(e.crc); u32(e.data.length); u32(e.data.length); u16(e.name.length); u16(0); u16(0);
      u16(0); u16(0); u32(e.dir ? 0x10 : 0); u32(e.offset);
      out.set(e.name, p); p += e.name.length;
    });
    const cdSize = p - cdStart;
    u32(0x06054b50); u16(0); u16(0); u16(entries.length); u16(entries.length); u32(cdSize); u32(cdStart); u16(0);
    return out.subarray(0, p);
  }
  R.zip = Object.assign(R.zip || {}, { build, crc32 });
})(RVN);
