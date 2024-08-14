# taro-sse

[![NPM version](https://img.shields.io/npm/v/taro-sse.svg?style=flat)](https://npmjs.org/package/taro-sse)
[![NPM downloads](http://img.shields.io/npm/dm/taro-sse.svg?style=flat)](https://npmjs.org/package/taro-sse)

A react library developed with dumi

## Usage

```bash
npm install taro-sse --save
```

```js
import SSE from 'taro-sse';

const sse = new SSE({
  url: 'http://localhost:3000/sse',
});
sse.on('message', (data) => {
  console.log(data);
});
sse.on('open', () => {
  console.log('open');
});
sse.on('error', (err) => {
  console.log(err);
});
sse.on('close', () => {
  console.log('close');
});
sse.connect();
```

## Options

[Options](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)
