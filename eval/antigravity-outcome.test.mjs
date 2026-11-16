import assert from 'node:assert/strict';
import test from 'node:test';
import { assessArtifact, assessBrowser } from './antigravity-outcome.mjs';

test('requires an actual draft or a change to a requested file', () => {
  assert.equal(assessArtifact({ entry: '', changed: ['README.md'] }), 'Missing or empty index.html');
  assert.equal(assessArtifact({ entry: '<h1>Existing</h1>', changed: ['notes.txt'], editable: ['styles.css'] }), 'No requested file changed');
  assert.equal(assessArtifact({ entry: '<h1>Candidate</h1>', changed: ['styles.css'], editable: ['styles.css'] }), null);
  assert.equal(assessArtifact({ entry: '<h1>Draft</h1>', changed: ['index.html'] }), null);
});

test('screenshots do not imply visual inspection or passing interactions', () => {
  const browser = { screenshots: ['desktop', 'mobile'], interactions: [{ passed: false }], pageErrors: [] };
  assert.deepEqual(assessBrowser(browser, 2), {
    capture: 'complete', visualInspection: 'pending', interactionVerification: 'failed',
  });
  assert.equal(assessBrowser({ ...browser, screenshots: ['desktop'] }, 0).capture, 'incomplete');
  assert.equal(assessBrowser({ ...browser, interactions: [{ passed: true }, { passed: true }] }, 2).interactionVerification, 'passed');
});
