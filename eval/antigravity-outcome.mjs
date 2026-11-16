export function assessArtifact({ entry, changed, editable }) {
  if (!entry?.trim()) return 'Missing or empty index.html';
  if (editable && !changed.some((path) => editable.includes(path))) return 'No requested file changed';
  return null;
}

export function assessBrowser({ screenshots, interactions, pageErrors, error }, expectedInteractions) {
  const captured = screenshots.length === 2 && !error;
  return {
    capture: captured ? 'complete' : 'incomplete',
    visualInspection: captured ? 'pending' : 'unavailable',
    interactionVerification: interactions.length !== expectedInteractions || !interactions.every((check) => check.passed) || pageErrors.length
      ? 'failed'
      : expectedInteractions ? 'passed' : 'no checks configured',
  };
}
