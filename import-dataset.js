import { ensureSchema, importDataset, loadDatasetRows } from './server/setup.js';

async function main() {
  try {
    const datasetRows = await loadDatasetRows();
    await ensureSchema();
    await importDataset(datasetRows);
    console.log(`Imported ${datasetRows.length} student-day rows into student_day_metrics.`);
  } catch (error) {
    console.error('Failed to import Eastbrook dataset.');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
