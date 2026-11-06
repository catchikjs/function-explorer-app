// Catalogue reconciliation is independent of student answers and learning progress.
export function ensureBundledWorksheets(data, catalog) {
  data.worksheets = Array.isArray(data.worksheets) ? data.worksheets : [];
  for (const assignment of data.worksheets) {
    if (catalog.some(book => book.id === assignment.contentId)) continue;
    const known = catalog.find(book => book.id === assignment.id) || catalog.find(book => book.title === assignment.title);
    if (known) assignment.contentId = known.id;
  }
  for (const className of new Set(data.profiles.map(profile => profile.className))) {
    for (const book of catalog) {
      if (!data.worksheets.some(item => item.className === className && (item.contentId || item.id) === book.id)) {
        data.worksheets.push({ id: className === '1학년 1반' ? book.id : `${book.id}:${encodeURIComponent(className)}`, contentId: book.id, title: book.title, className, subject: '공통수학2', createdAt: '2026-11-05T00:00:00.000Z' });
      }
    }
  }
  return data;
}
export function resolveWorkbookActivity(workbook, state) {
  const byId = workbook.activities.find(q => q.id === state.workbookActivityIds?.[workbook.id]);
  if (byId) return byId;
  let index = state.workbookActivityIndices?.[workbook.id];
  // Opening concepts were added before radical-a01. Retain the old question,
  // rather than attaching an old numeric position to a different new question.
  if (workbook.id === 'radical' && index !== undefined && (state.workbookActivityVersions?.radical || 1) < 2) {
    const legacy = workbook.activities.find(q => q.id === `radical-a${String(Number(index) + 1).padStart(2, '0')}`);
    if (legacy) return legacy;
  }
  if (index === undefined) {
    const oldPage = (Number(state.workbookPageIndices?.[workbook.id]) || 0) + 1;
    const mapped = workbook.activities.findIndex(q => q.sourcePage >= oldPage);
    index = mapped < 0 ? workbook.activities.length - 1 : mapped;
  }
  return workbook.activities[Math.max(0, Math.min(workbook.activities.length - 1, Number(index) || 0))];
}
