export interface RequestConfig {
  /**
   * 开发者服务器接口地址
   */
  url: string;
  /**
   * 请求的参数
   */
  data?: string | object | ArrayBuffer;
  /**
   * 设置请求的 header，header 中不能设置 Referer。content-type 默认为 application/json
   */
  headers?: {
    [key: string]: string;
  };
  /**
   * 超时时间，单位为毫秒。默认值为 60000
   */
  timeout?: number;
  /**
   * HTTP 请求方法
   * @default GET
   */
  method?:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'OPTIONS'
    | 'HEAD'
    | 'TRACE'
    | 'CONNECT';
  /**
   * 返回的数据格式
   * @default json
   */
  dataType?: string;
  /**
   * 设置响应的数据类型。合法值：text、arraybuffer
   * @default json
   */
  responseType?: 'text' | 'arraybuffer';
}
