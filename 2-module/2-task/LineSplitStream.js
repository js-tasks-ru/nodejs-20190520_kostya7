const stream = require('stream');
const os = require('os');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);
    this._last = '';
  }

  _transform(chunk, encoding, callback) {
    this._last += decoder.write(chunk);
    const lists = this._last.split(os.EOL);
    this._last = lists.pop();

    lists.forEach(list => this.push(list));

    callback();
  }

  _flush(callback) {
    this._last += decoder.end();
    if (this._last) {
      this.push(this._last);
    }
    callback();
  }
}

module.exports = LineSplitStream;
