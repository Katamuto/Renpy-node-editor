/* ZIP reader: RVN.zip.read(bytes) -> Promise<Map<path, Uint8Array>>. Supports "stored" and "deflate" entries,
   so projects re-zipped with any tool still open. Deflate needs DecompressionStream (all current browsers). */
(function (R) {
  async function inflate(data) {
    const ds = new DecompressionStream('deflate-raw');
    const out = new Response(new Blob([data]).stream().pipeThrough(ds));
    return new Uint8Array(await out.arrayBuffer());
  }
  R.zip = R.zip || {};
  R.zip.read = async function (bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let e = bytes.length - 22;
    while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('not a zip file');
    const count = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
    const files = new Map(), dec = new TextDecoder();
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('corrupt zip directory');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = dec.decode(bytes.subarray(p + 46, p + 46 + nlen));
      p += 46 + nlen + elen + clen;
      if (name.endsWith('/')) continue;
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const raw = bytes.slice(start, start + csize);
      files.set(name, method === 0 ? raw : method === 8 ? await inflate(raw) : (() => { throw new Error('unsupported zip method ' + method); })());
    }
    return files;
  };
})(RVN);
