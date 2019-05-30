const LimitSizeStream = require('./LimitSizeStream');
const fs = require('fs');

const limitedStream = new LimitSizeStream({limit: 8}); // 8 байт
const outStream = fs.createWriteStream('out.txt');
limitedStream.pipe(outStream);

limitedStream.write('hello');

setTimeout(() => {
    limitedStream.write('world');
}, 10);