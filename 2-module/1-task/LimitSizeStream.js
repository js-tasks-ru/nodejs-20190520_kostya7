const stream = require('stream');
const LimitExceededError = require('./LimitExceededError');

class LimitSizeStream extends stream.Transform {
  constructor(options) {
  options.readableHighWaterMark = options.limit;
    super(options);
    this.limit = options.limit;
    this.bufferArr = [];
  }

  _transform(chunk, encoding, callback) {
        this.bufferArr.push(chunk);
        const buffer = Buffer.concat(this.bufferArr);

       if (buffer.byteLength > this.limit) {
         callback(new LimitExceededError);
       } else {
          callback(null, chunk);
       }
  }
}


module.exports = LimitSizeStream;
