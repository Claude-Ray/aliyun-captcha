## 阿里云验证码服务sdk

官方没有提供node sdk，npm的`waliyun`也没有验证码服务。因此按照php-v20180112版sdk做了一个

其他版本使用方式可能存在区别，[实现过程](https://claude-ray.github.io/2018/07/31/%E9%98%BF%E9%87%8C%E4%BA%91%E9%AA%8C%E8%AF%81%E7%A0%81node%E6%8E%A5%E5%85%A5/)仅供参考

## example

```js
// init
const aliyun = require('aliyun')({
  AccessKeyId: '',
  AppKey: '',
  AccessKeySecret: ''
});

aliyun({
  // opts
})
.then(result => {
  // fn
});
```