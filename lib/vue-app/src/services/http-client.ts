import { AxiosInstance } from "axios";

export default class HttpClient {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private readonly axios: AxiosInstance,
    private readonly baseUri: string
  ) {}

  public async get<T>(uri: string, query?: {}, headers = {}): Promise<T> {
    const config = query
      ? { params: query, headers: headers, timeout: 30000 }
      : undefined;
    return (await this.axios.get<T>(this.uri(uri), config)).data;
  }

  public async post<T>(uri: string, payload?: any, headers = {}): Promise<T> {
    const config = { headers: headers, timeout: 30000 };
    return (await this.axios.post<T>(this.uri(uri), payload, config)).data;
  }

  protected uri(uri?: string) {
    return uri ? `${this.baseUri}${uri}` : this.baseUri;
  }
}
