//接口异常采集
import reportTracker from '../../utils/reportTracker';

function requestCatch<T extends keyof XMLHttpRequest>(type1: T, type2: T) {
  //开启fetch监控
  fetchCatch();

  const oldopen = XMLHttpRequest.prototype[type1];
  const oldosend = XMLHttpRequest.prototype[type2];
  let logData = {
    method: '',
    url: '',
  };

  XMLHttpRequest.prototype.open = function (method: string, url: string, async?: boolean) {
    logData = {
      method,
      url,
    };
    // eslint-disable-next-line prefer-rest-params
    return oldopen.apply(this, arguments);
  };

  let startTime: number;
  XMLHttpRequest.prototype.send = function (body) {
    if (logData) {
      //发送时候记录时间
      startTime = Date.now();
      const handler =
        (type: string) =>
        (event: any): void => {
          const duration = Date.now() - startTime;
          const status = this.status;
          const statusText = this.statusText;
          const requestInfo = {
            name: 'request',
            type: 'xhr',
            eventType: event.type,
            pathName: logData.url,
            status: status + '-' + statusText,
            duration,
            response: this.response ? JSON.stringify(this.response) : '',
            params: body || '',
          };
          reportTracker(requestInfo);
        };

      this.addEventListener('load', handler('load'), false);
      this.addEventListener('error', handler('error'), false);
      this.addEventListener('abort', handler('abort'), false);
    }

    // eslint-disable-next-line prefer-rest-params
    oldosend.apply(this, arguments);
  };
}

function fetchCatch() {
  const originFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const startTime = Date.now();

    // eslint-disable-next-line prefer-rest-params
    const args = arguments;

    const fetchInput = args[0];
    let method = 'GET';
    let url;
    if (typeof fetchInput === 'string') {
      url = fetchInput;
    } else if ('Request' in window && fetchInput instanceof window.Request) {
      url = fetchInput.url;
      if (fetchInput.method) {
        method = fetchInput.method;
      }
    } else {
      url = '' + fetchInput;
    }

    if (args[1] && args[1].method) {
      method = args[1].method;
    }
    const fetchData = {
      name: 'request',
      method: method,
      pathName: url,
      status: 0,
      type: '',
      duration: 0,
      response: 'null',
      params: init?.body || '',
    };
    // eslint-disable-next-line prefer-rest-params
    return originFetch.apply(this, arguments as any).then(function (response) {
      fetchData.status = response.status;
      fetchData.type = 'fetch';
      fetchData.duration = Date.now() - startTime;
      console.log(fetchData);
      reportTracker(fetchData);
      return response;
    });
  };
}

export default requestCatch;
