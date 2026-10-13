import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

async function loadApi(relativePath) {
  const source = (await readFile(new URL(relativePath, import.meta.url), 'utf8'))
    .replaceAll('import.meta.env', '({ VITE_API_URL: "http://localhost:5000/api" })');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const staff = await loadApi('../SerwisSystem.Client/src/api/api.js');
const customer = await loadApi('../SerwisSystem.Customer/src/api/api.js');

test('repair method filters are combined with status filters', async () => {
  const requests = captureRequest();
  await staff.getRepairs({ statuses: ['Completed'], repairMethods: ['Shipping', 'OnSite'] });
  const query = new URL(requests[0].url).searchParams;
  assert.deepEqual(query.getAll('repairMethods'), ['Shipping', 'OnSite']);
  assert.deepEqual(query.getAll('statuses'), ['Completed']);
});

test('PDF download preserves bytes and sends authorization', async () => {
  let sentHeaders;
  globalThis.fetch = async (_url, options) => {
    sentHeaders = options.headers;
    return new Response('%PDF-1.7 test', { headers: { 'Content-Type': 'application/pdf' } });
  };
  const pdf = await staff.downloadRepairPdf(123);
  assert.ok(pdf instanceof Blob);
  assert.equal(await pdf.text(), '%PDF-1.7 test');
  assert.equal(sentHeaders.Authorization, 'Bearer test-token');
});
globalThis.localStorage = { getItem: () => 'test-token', removeItem: () => {} };

function captureRequest() {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return requests;
}

test('customer lookup sends code, email and serial, never an ID', async () => {
  const requests = captureRequest();
  const input = { code: 'ABCDEFGH', email: 'customer@example.invalid', serialNumber: 'Original-123' };
  await customer.checkRepair(input);
  assert.equal(requests[0].url, 'http://localhost:5000/api/repairs/check');
  assert.deepEqual(JSON.parse(requests[0].options.body), input);
});

test('every repair action supplies the displayed version', async () => {
  const requests = captureRequest();
  for (const action of [staff.takeRepair, staff.completeRepair, staff.cancelRepair, staff.returnRepair, staff.deleteRepair]) {
    await action(42, 123);
  }
  assert.equal(requests.length, 5);
  for (const request of requests) assert.deepEqual(JSON.parse(request.options.body), { version: 123 });
});

test('password change uses the backend route', async () => {
  const requests = captureRequest();
  await staff.changePassword('old', 'new');
  assert.equal(requests[0].url, 'http://localhost:5000/api/users/changePassword');
});

test('staff and customer reads propagate cancellation', async () => {
  globalThis.fetch = (_, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true });
  });
  for (const read of [signal => staff.getRepair(1, signal), signal => staff.getUsers({}, signal),
    signal => staff.getRepairs({}, signal), signal => staff.getUser(1, signal),
    signal => staff.getLoggedUser(signal), signal => staff.getAdmins(signal),
    signal => customer.checkRepair({ code: 'ABCDEFGH' }, signal)]) {
    const controller = new AbortController();
    const request = read(controller.signal);
    controller.abort();
    await assert.rejects(request, { name: 'AbortError' });
  }
});

test('field validation errors are readable in both applications', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    message: 'Validation failed.', errors: { Email: ['Invalid email.'], Product: ['Product required.'] }
  }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  await assert.rejects(customer.createRepair({}), /Invalid email\. Product required\./);
  await assert.rejects(staff.register('', '', ''), /Invalid email\. Product required\./);
});
