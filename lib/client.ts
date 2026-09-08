export async function api(path: string, body?: any, method = 'POST') {
  const response = await fetch('/api/' + path, {
    method: body === undefined ? 'GET' : method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server did not respond. Please try again.');
  }
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
