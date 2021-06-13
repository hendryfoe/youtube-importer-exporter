export type RequestOptions = Omit<RequestInit, 'method'>;
export type IResponse<T> = Pick<
  Response,
  'headers' | 'status' | 'statusText'
> & { data: T };

async function toResponse<T>(response: Response): Promise<IResponse<T>> {
  const data = await response.json();

  return {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
    data,
  };
}

export async function request<T>(
  url: string,
  method: string,
  requestOptions?: RequestOptions
): Promise<IResponse<T>> {
  const response = await fetch(url, { method, ...requestOptions });
  const result = await toResponse<T>(response);

  if (!response.ok) {
    throw result;
  }

  return result;
}

export async function get<T>(
  url: string,
  requestOptions?: RequestOptions
): Promise<IResponse<T>> {
  return request<T>(url, 'GET', requestOptions);
}

export async function post<T>(
  url: string,
  body: BodyInit,
  requestOptions?: Omit<RequestOptions, 'body'>
): Promise<IResponse<T>> {
  return request<T>(url, 'POST', { body, ...requestOptions });
}
