const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadRequest({ uploadFiles, post }) {
  const source = fs.readFileSync(path.join(__dirname, '../src/reusables/hooks/requests.ts'), 'utf8');
  const start = source.indexOf('const UpdateRealmMediaRequest = async');
  const end = source.indexOf('\n/**', start);
  const compiled = ts.transpileModule(`${source.slice(start, end)}\nexports.request = UpdateRealmMediaRequest;`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, uploadFiles, Axios: { post }, envs: { CHATTERLOOP_API: 'https://fixture.test' },
    localStorage: { getItem: () => 'fixture-token' }, console: { log() {} },
    uploadRequestError: error => error, toRequestError: error => error,
  });
  return exports.request;
}

test('community photo delivery retry reuses the completed upload and caption', async () => {
  let uploads = 0;
  let uploadID;
  const requests = [];
  const request = loadRequest({
    uploadFiles: async () => { uploads++; return [{ uploadID: 'upload-one' }]; },
    post: async (_, body) => {
      requests.push(body);
      if (requests.length === 1) throw new Error('Delivery incomplete');
      return { data: { status: true } };
    },
  });
  const payload = {
    realm_id: 'garden', realm_type: 'community', media_type: 'cover_photo',
    image: {}, caption: 'Our new cover', onUploaded: value => { uploadID = value; },
  };
  await assert.rejects(request(payload), /Delivery incomplete/);
  assert.equal(uploadID, 'upload-one');
  assert.equal((await request({ ...payload, uploadID })).status, true);
  assert.equal(uploads, 1);
  assert.deepEqual(requests.map(body => body.uploadID), ['upload-one', 'upload-one']);
  assert.equal(requests[1].caption, 'Our new cover');
});

test('storage failure does not retain an unusable upload for retry', async () => {
  let retained = false;
  let posted = false;
  const request = loadRequest({
    uploadFiles: async () => { throw new Error('Upload failed'); },
    post: async () => { posted = true; },
  });
  await assert.rejects(request({
    realm_id: 'garden', media_type: 'profile', image: {},
    onUploaded: () => { retained = true; },
  }), /Upload failed/);
  assert.equal(retained, false);
  assert.equal(posted, false);
});
