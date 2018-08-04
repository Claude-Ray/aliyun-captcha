'use strict';

const crypto = require('crypto');
const request = require('request-promise');
const uuid = require('uuid');

const AFS_ENDPOINT = 'https://afs.aliyuncs.com';

const DEFAULTS = {
  Action: 'AuthenticateSig',
  Format: 'JSON',
  RegionId: 'cn-hangzhou',
  SignatureMethod: 'HMAC-SHA1',
  SignatureVersion: '1.0',
  Version: '2018-01-12'
};

/**
 * 接收配置常量，返回验证函数
 * @param {object} config 核心配置
 * @param {string} config.AccessKeyId
 * @param {string} config.AppKey
 * @param {string} config.AccessKeySecret
 * @return {function}
 *
 * 传递其他变量，返回验证结果
 * @param {object} opts 发送给阿里的参数
 * @param {string} opts.Token
 * @param {string} opts.SessionId
 * @param {string} opts.Sig
 * @param {string} opts.RemoteIp
 * @param {string} [opts.Scene] 使用场景, 用于报表, 官方建议传
 * @return 原样返回阿里结果
 */
module.exports = (config = {}) => (opts = {}) => {
  const { Token, SessionId, Sig, RemoteIp } = opts;

  const { AccessKeyId, AppKey, AccessKeySecret } = config;

  // config校验放在内部，避免影响项目启动
  if (!(AccessKeyId, AppKey, AccessKeySecret))
    throw new TypeError('missing config');
  // 验签会产生收费，校验必选参数可节省额度
  if (!(Token && SessionId && Sig && RemoteIp))
    throw new TypeError('missing param');

  const params = Object.assign({
    AccessKeyId,
    AppKey,
    // 唯一随机数，用于防止网络重放攻击。用户在不同请求间要使用不同的随机数值
    SignatureNonce: uuid.v4().replace(/-/g, ''),
    Timestamp: new Date().toISOString()
  }, DEFAULTS, opts);

  params.Signature = getSignature(params, AccessKeySecret, 'GET');

  return request.get(AFS_ENDPOINT, {
    qs: params,
    timeout: 5000,
    json: true
    // headers: {'x-sdk-client': 'php/2.0.0'}
  });
};

/**
 * 构建标准编码的字符串
 * @desc 参照RFC3986规范
 * Not Escaped: A-Z a-z 0-9 - _ . ~
 * @param {string} str
 * @return {string}
 */
function escaper(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

/**
 * 计算签名
 * @desc 文档地址
 * https://help.aliyun.com/document_detail/66349.html
 * @param {object} params
 * @param {string} secret
 * @param {string} method
 * @return {string} 用于拼接url时要再一次escaper，如果放在qs参数可直接传递
 */
function getSignature(params, secret, method = 'GET') {
  const canonicalizedQS = Object.keys(params).sort().map(key => `${escaper(key)}=${escaper(params[key])}`).join('&');
  const signStr = `${method.toUpperCase()}&${escaper('/')}&${escaper(canonicalizedQS)}`;
  return crypto.createHmac('sha1', `${secret}&`).update(signStr).digest('base64');
}