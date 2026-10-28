/** Read workflow responses without exposing framework HTML or JSON parser errors. */
export async function readGateResponse(response) {
  const fallback = `The workflow service returned an unreadable response (HTTP ${response.status}). Refresh the app and try again.`;
  let data;
  try {
    data = JSON.parse(await response.text());
  } catch {
    throw Error(fallback);
  }
  if (!response.ok)
    throw Error(
      typeof data?.error === 'string'
        ? data.error
        : 'The workflow service could not complete the request. Try again.',
    );
  const statuses = ['running', 'passed', 'failed', 'needs-attention', 'interrupted'];
  const stageStatuses = ['pending', 'running', 'passed', 'failed', 'skipped'];
  if (
    !data ||
    typeof data.id !== 'string' ||
    !statuses.includes(data.status) ||
    !Array.isArray(data.stages) ||
    data.stages.length !== 5 ||
    !Array.isArray(data.notes) ||
    data.notes.some((note) => typeof note !== 'string') ||
    data.stages.some(
      (s, i) =>
        !s ||
        s.id !== `G${i + 1}` ||
        typeof s.title !== 'string' ||
        !stageStatuses.includes(s.status) ||
        !Array.isArray(s.checks) ||
        s.checks.some((c) => typeof c !== 'string') ||
        (s.error != null && typeof s.error !== 'string') ||
        (s.clientReview &&
          (!Array.isArray(s.clientReview.findings) || !Array.isArray(s.clientReview.requirements))),
    )
  )
    throw Error(
      'The workflow service returned incomplete results. Refresh the app and run the check again.',
    );
  return data;
}
