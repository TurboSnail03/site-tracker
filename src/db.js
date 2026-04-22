import Dexie from 'dexie';

// 1. Initialize the Database
export const db = new Dexie('SiteTrackerDB');

// 2. Define the Schema
// projectId is indexed so we can switch between sites instantly.
// ++id creates an auto-incrementing unique ID for every entry.
db.version(1).stores({
  projects: '++id, name',
  categories: 'id, projectId, name',
  transactions: 'id, categoryId, projectId, type, date'
});

// 3. Populate default project if new
db.on('populate', () => {
  db.projects.add({ name: 'Site A' });
});