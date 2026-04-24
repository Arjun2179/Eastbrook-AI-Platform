import { initializeDatabase } from './server/setup.js';

async function main() {
  try {
    const summary = await initializeDatabase({ reset: true });
    console.log('Eastbrook database initialized successfully.');
    console.log(`Profiles by role: ${summary.roles.map((row) => `${row.role}=${row.count}`).join(', ')}`);
    console.log(`Imported student-day rows: ${summary.metricCount}`);
    if (summary.firstStudent) {
      console.log(`Sample student login: ${summary.firstStudent.email}`);
    }
    console.log(`Demo password: ${summary.demoPassword}`);
  } catch (error) {
    console.error('Failed to initialize Eastbrook database.');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
