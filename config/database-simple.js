const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database structure
const initialData = {
  users: [],
  otps: [],
  waste_reports: [],
  grievances: [],
  water_connections: [],
  water_bills: [],
  electricity_connections: [],
  electricity_bills: [],
  meter_readings: [],
  gas_connections: [],
  gas_bookings: [],
  scholarships: [
    {
      id: 1,
      name: 'Pre-Matric Scholarship',
      description: 'For students studying in classes 1-10',
      category: 'Merit',
      eligibility: 'Class 1-10, Family income < 2.5 Lakh',
      amount: 12000,
      deadline: '2026-06-30',
      is_active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Post-Matric Scholarship',
      description: 'For students studying in classes 11-12 and higher education',
      category: 'Merit',
      eligibility: 'Class 11+ or College, Family income < 2.5 Lakh',
      amount: 20000,
      deadline: '2026-08-31',
      is_active: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Merit-cum-Means Scholarship',
      description: 'For economically weaker meritorious students',
      category: 'Merit-cum-Means',
      eligibility: 'Minimum 75% marks, Family income < 1.5 Lakh',
      amount: 25000,
      deadline: '2026-07-15',
      is_active: 1,
      created_at: new Date().toISOString()
    }
  ],
  scholarship_applications: [],
  payments: []
};

class SimpleDB {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.writeData(initialData);
      console.log('✅ Database initialized');
    }
  }

  readData() {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database:', error);
      return initialData;
    }
  }

  writeData(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing database:', error);
    }
  }

  // Generic CRUD operations
  find(table, filter = {}) {
    const data = this.readData();
    if (!data[table]) return [];

    if (Object.keys(filter).length === 0) {
      return data[table];
    }

    return data[table].filter(item => {
      return Object.keys(filter).every(key => item[key] === filter[key]);
    });
  }

  findOne(table, filter) {
    const results = this.find(table, filter);
    return results.length > 0 ? results[0] : null;
  }

  insert(table, record) {
    const data = this.readData();
    if (!data[table]) data[table] = [];

    // Auto-increment ID
    const lastId = data[table].length > 0 
      ? Math.max(...data[table].map(item => item.id || 0))
      : 0;
    
    record.id = lastId + 1;
    record.created_at = record.created_at || new Date().toISOString();

    data[table].push(record);
    this.writeData(data);
    
    return record;
  }

  update(table, filter, updates) {
    const data = this.readData();
    if (!data[table]) return 0;

    let count = 0;
    data[table] = data[table].map(item => {
      const matches = Object.keys(filter).every(key => item[key] === filter[key]);
      if (matches) {
        count++;
        return { ...item, ...updates, updated_at: new Date().toISOString() };
      }
      return item;
    });

    this.writeData(data);
    return count;
  }

  delete(table, filter) {
    const data = this.readData();
    if (!data[table]) return 0;

    const originalLength = data[table].length;
    data[table] = data[table].filter(item => {
      return !Object.keys(filter).every(key => item[key] === filter[key]);
    });

    const deletedCount = originalLength - data[table].length;
    if (deletedCount > 0) {
      this.writeData(data);
    }

    return deletedCount;
  }

// Count records
  count(table, filter = {}) {
    return this.find(table, filter).length;
  }

  // Sum a field
  sum(table, field, filter = {}) {
    const records = this.find(table, filter);
    return records.reduce((sum, record) => sum + (record[field] || 0), 0);
  }
}

const db = new SimpleDB();

module.exports = db;
