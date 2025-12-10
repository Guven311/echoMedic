declare namespace Deno {
  interface RequestInfo {
    method: string;
    headers: Headers;
    json(): Promise<any>;
  }

  interface Env {
    get(name: string): string | undefined;
  }

  const env: Env;

  function serve(
    handler: (req: RequestInfo) => Response | Promise<Response>
  ): void;
}

declare class Request {
  method: string;
  headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
}

declare class Response {
  constructor(body?: any, init?: any);
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<any>;
}

declare class Headers {
  get(name: string): string | null;
}
