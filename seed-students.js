import {
  ensureSchema,
  getSetupSummary,
  loadDatasetRows,
  seedBaseUsers,
  seedEducatorMappings,
  seedStudentProfiles,
} from './server/setup.js';

async function main() {
  try {
    const datasetRows = await loadDatasetRows();
    await ensureSchema();
    await seedBaseUsers();
    await seedStudentProfiles(datasetRows);
    await seedEducatorMappings();
    const summary = await getSetupSummary();

    console.log('Student accounts seeded successfully.');
    console.log(`Profiles by role: ${summary.roles.map((row) => `${row.role}=${row.count}`).join(', ')}`);
    if (summary.firstStudent) {
      console.log(`Sample student login: ${summary.firstStudent.email}`);
    }
    console.log(`Demo password: ${summary.demoPassword}`);
  } catch (error) {
    console.error('Failed to seed student accounts.');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
