import Taro, { RequestTask } from '@tarojs/taro';
import { Buffer } from 'buffer';
import { RequestConfig } from './types';
import { isJsonString } from './utils';

interface EventData {
  event?: 'success' | 'error' | 'open' | 'message';
  data?: string | object | string[] | object[];
}

interface Listeners {
  [event: string]: ((data: any) => void)[];
}

export default class TaroEventSource<T = any> {
  config: RequestConfig;
  listeners: Listeners;
  requestTask: RequestTask<T> | null;
  halfString: string = '';

  /**
   * 构造函数
   *
   * @param config 请求配置
   */
  constructor(config: RequestConfig) {
    this.config = config;
    this.listeners = {};
    this.requestTask = null;
    this.connect();
  }
  /**
   * 连接请求
   *
   * @remarks
   * 发送一个网络请求，并处理返回的数据
   *
   * @returns 无返回值
   */
  connect() {
    this.requestTask = Taro.request({
      enableChunked: true,
      responseType: 'text',
      ...this.config,
      success: (res) => {
        this.emit('success', res);
      },
      fail: (err) => {
        this.emit('error', err);
      },
    });
    this.requestTask.onHeadersReceived((res) => {
      this.emit('open', res);
    });
    this.requestTask.onChunkReceived((res) => {
      this.handleChunk(res);
    });
  }

  /**
   * 处理数据块
   *
   * @param res 包含数据的对象
   * @param res.data ArrayBuffer类型的数据
   * @returns 无返回值
   */
  handleChunk(res: { data: ArrayBuffer }) {
    // 将传入的 ArrayBuffer 赋值给 arrayBuffer 变量
    const arrayBuffer = res.data;
    // 将 arrayBuffer 转换为 Uint8Array 类型，并赋值给 uint8Array 变量
    const uint8Array = new Uint8Array(arrayBuffer);
    // 将 uint8Array 转换为 Base64 编码的字符串，并赋值给 data 变量
    let data = Taro.arrayBufferToBase64(uint8Array);
    // 将 Base64 编码的字符串转换为 utf8 编码的字符串，并重新赋值给 data 变量
    data = Buffer.from(data, 'base64').toString('utf8');
    // 调用 parseEventData 方法解析 data，并将结果赋值给 eventData 变量
    const eventData = this.parseEventData(data);
    // 如果 eventData 的 data 属性不存在，则直接返回
    if (!eventData?.data) return;
    // 触发事件，事件名为 eventData.event 或 'message'，并传递 { data: eventData.data } 作为参数
    this.emit(eventData.event || 'message', { data: eventData.data });
  }

  /**
   * 解析事件数据
   *
   * @param data 待解析的字符串数据
   * @returns 解析后的事件数据对象
   */
  parseEventData(data: string): EventData {
    const lines = data.split('\n');
    const result: EventData = {};
    const linesArr = lines.filter((l) => l.length);
    if (!Array.isArray(linesArr)) return result;
    let parsedLines: T[] = [];
    for (let i = 0; i < linesArr.length; i++) {
      let l = linesArr[i];
      // 判断是否完整的data:[{}]
      let item;
      if (l.startsWith('data:')) {
        l = l.substring(5).trim();
      }
      // 判断是否是空行
      if (!l) {
        continue;
      }
      // 判断当前是否完整
      if (!isJsonString(l)) {
        // 如果不完整，判断是否是上一次的剩余部分
        if (this.halfString) {
          // 上次剩余部分和当前拼接后是否是完整的
          if (isJsonString(this.halfString + l)) {
            l = this.halfString + l;
            this.halfString = '';
          } else {
            this.halfString = this.halfString + l;
            continue;
          }
        } else {
          this.halfString = l;
          continue;
        }
      }
      if (isJsonString(l)) {
        item = JSON.parse(l);
        parsedLines = [...parsedLines, ...item];
      } else {
        console.log('%c not json: ' + l, 'color: red');
      }
    }

    parsedLines = parsedLines.filter((i) => i);
    // console.log('parsedLines', parsedLines);

    result.data = parsedLines.length ? parsedLines : undefined;

    return result;
  }

  /**
   * 添加事件监听器
   *
   * @param event 事件类型，可选值为 'success' | 'error' | 'open' | 'message'
   * @param callback 回调函数，当事件触发时执行，参数为事件数据
   */
  addEventListener(
    // 事件类型，可选值为 'success'、'error'、'open'、'message'
    event: 'success' | 'error' | 'open' | 'message',
    // 回调函数，参数为任意类型的数据
    callback: (data: any) => void,
  ) {
    // 如果监听器数组中不存在对应事件的监听器数组，则初始化一个空数组
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    // 将回调函数添加到对应事件的监听器数组中
    this.listeners[event].push(callback);
  }

  /**
   * 触发事件，调用事件监听器
   *
   * @param event 事件名称
   * @param data 事件数据
   */
  emit(event: string, data: any) {
    // 如果存在对应事件的监听器
    if (this.listeners[event]) {
      // 遍历所有监听器
      this.listeners[event].forEach((callback) => {
        // 调用监听器的回调函数，并传入数据
        callback(data);
      });
    }
  }

  /**
   * 关闭请求任务
   *
   * 如果当前实例存在请求任务，则调用其abort方法终止请求
   */
  close() {
    // 如果存在请求任务
    if (this.requestTask) {
      // 终止请求任务
      this.requestTask.abort();
    }
  }
}
