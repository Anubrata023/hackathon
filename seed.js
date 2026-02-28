// src/db/seed.js
// Seeds realistic initial data for the Assam Government Portal

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const db = new Database(path.resolve(process.env.DB_PATH || './db/assam_portal.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('🌱 Seeding database...');

// ─── ADMIN USER ─────────────────────────────────────────────────────────────
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@Assam2026!', 12);
  db.prepare(`INSERT INTO users (id, name, email, phone, password, role) VALUES (?,?,?,?,?,?)`)
    .run(uuidv4(), 'Portal Administrator', process.env.ADMIN_EMAIL || 'admin@assam.gov.in',
        '+91-9999900000', hash, 'admin');
  console.log('  ✅ Admin user created');
}

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────
const depts = [
  { id: uuidv4(), name_en: 'Health & Family Welfare', name_hi: 'स्वास्थ्य एवं परिवार कल्याण', name_bn: 'স্বাস্থ্য ও পরিবার কল্যাণ', name_as: 'স্বাস্থ্য আৰু পৰিয়াল কল্যাণ', icon: '🏥', url: 'https://health.assam.gov.in', sort_order: 1 },
  { id: uuidv4(), name_en: 'Education', name_hi: 'शिक्षा', name_bn: 'শিক্ষা', name_as: 'শিক্ষা', icon: '🎓', url: 'https://education.assam.gov.in', sort_order: 2 },
  { id: uuidv4(), name_en: 'Agriculture', name_hi: 'कृषि', name_bn: 'কৃষি', name_as: 'কৃষি', icon: '🌾', url: 'https://agri.assam.gov.in', sort_order: 3 },
  { id: uuidv4(), name_en: 'Finance', name_hi: 'वित्त', name_bn: 'অর্থ', name_as: 'বিত্ত', icon: '💰', url: 'https://finance.assam.gov.in', sort_order: 4 },
  { id: uuidv4(), name_en: 'Home & Political', name_hi: 'गृह एवं राजनीतिक', name_bn: 'স্বরাষ্ট্র ও রাজনৈতিক', name_as: 'গৃহ আৰু ৰাজনৈতিক', icon: '🏛️', url: 'https://home.assam.gov.in', sort_order: 5 },
  { id: uuidv4(), name_en: 'Public Works', name_hi: 'लोक निर्माण', name_bn: 'পূর্ত কার্য', name_as: 'ৰাজহুৱা নিৰ্মাণ', icon: '🏗️', url: 'https://pwd.assam.gov.in', sort_order: 6 },
  { id: uuidv4(), name_en: 'Transport', name_hi: 'परिवहन', name_bn: 'পরিবহন', name_as: 'পৰিবহন', icon: '🚌', url: 'https://transport.assam.gov.in', sort_order: 7 },
  { id: uuidv4(), name_en: 'Revenue & Disaster Management', name_hi: 'राजस्व एवं आपदा प्रबंधन', name_bn: 'রাজস্ব ও দুর্যোগ ব্যবস্থাপনা', name_as: 'ৰাজহ আৰু দুৰ্যোগ ব্যৱস্থাপনা', icon: '📋', url: 'https://revenue.assam.gov.in', sort_order: 8 },
  { id: uuidv4(), name_en: 'Forest & Environment', name_hi: 'वन एवं पर्यावरण', name_bn: 'বন ও পরিবেশ', name_as: 'বন আৰু পৰিবেশ', icon: '🌳', url: 'https://forests.assam.gov.in', sort_order: 9 },
  { id: uuidv4(), name_en: 'Social Welfare', name_hi: 'समाज कल्याण', name_bn: 'সমাজ কল্যাণ', name_as: 'সমাজ কল্যাণ', icon: '🤝', url: 'https://socialwelfare.assam.gov.in', sort_order: 10 },
  { id: uuidv4(), name_en: 'Water Resources', name_hi: 'जल संसाधन', name_bn: 'জল সম্পদ', name_as: 'জলসম্পদ', icon: '💧', url: 'https://water.assam.gov.in', sort_order: 11 },
  { id: uuidv4(), name_en: 'Industries & Commerce', name_hi: 'उद्योग एवं वाणिज्य', name_bn: 'শিল্প ও বাণিজ্য', name_as: 'উদ্যোগ আৰু বাণিজ্য', icon: '🏭', url: 'https://industrycommerce.assam.gov.in', sort_order: 12 },
];

const insertDept = db.prepare(`INSERT OR IGNORE INTO departments (id, name_en, name_hi, name_bn, name_as, icon, url, sort_order) VALUES (?,?,?,?,?,?,?,?)`);
for (const d of depts) insertDept.run(d.id, d.name_en, d.name_hi, d.name_bn, d.name_as, d.icon, d.url, d.sort_order);
console.log(`  ✅ ${depts.length} departments seeded`);

// ─── SERVICES ────────────────────────────────────────────────────────────────
const services = [
  // Municipal
  { id: uuidv4(), category: 'municipal', title_en: 'Property Tax Payment', title_hi: 'संपत्ति कर भुगतान', title_bn: 'সম্পত্তি কর পরিশোধ', title_as: 'সম্পত্তি কৰ পৰিশোধ', desc_en: 'Pay your municipal property tax online.', icon: '🏠', sort_order: 1 },
  { id: uuidv4(), category: 'municipal', title_en: 'Trade Licence', title_hi: 'व्यापार लाइसेंस', title_bn: 'ট্রেড লাইসেন্স', title_as: 'ব্যৱসায়িক অনুজ্ঞাপত্ৰ', desc_en: 'Apply or renew trade licence for your business.', icon: '📜', sort_order: 2 },
  { id: uuidv4(), category: 'municipal', title_en: 'Birth Certificate', title_hi: 'जन्म प्रमाण पत्र', title_bn: 'জন্ম সনদ', title_as: 'জন্ম প্ৰমাণপত্ৰ', desc_en: 'Apply for birth certificate online.', icon: '👶', sort_order: 3 },
  { id: uuidv4(), category: 'municipal', title_en: 'Death Certificate', title_hi: 'मृत्यु प्रमाण पत्र', title_bn: 'মৃত্যু সনদ', title_as: 'মৃত্যু প্ৰমাণপত্ৰ', desc_en: 'Apply for death certificate online.', icon: '📃', sort_order: 4 },
  // Gas
  { id: uuidv4(), category: 'gas', title_en: 'New Gas Connection', title_hi: 'नया गैस कनेक्शन', title_bn: 'নতুন গ্যাস সংযোগ', title_as: 'নতুন গেছ সংযোগ', desc_en: 'Apply for a new domestic gas connection.', icon: '🔥', sort_order: 1 },
  { id: uuidv4(), category: 'gas', title_en: 'Cylinder Booking', title_hi: 'सिलेंडर बुकिंग', title_bn: 'সিলিন্ডার বুকিং', title_as: 'চিলিণ্ডাৰ বুকিং', desc_en: 'Book your LPG cylinder refill online.', icon: '🛢️', sort_order: 2 },
  { id: uuidv4(), category: 'gas', title_en: 'Subsidy Status', title_hi: 'सब्सिडी स्थिति', title_bn: 'ভর্তুকি অবস্থা', title_as: 'ভৰ্তুকি স্থিতি', desc_en: 'Check your LPG subsidy transfer status.', icon: '💵', sort_order: 3 },
  // Electricity
  { id: uuidv4(), category: 'electricity', title_en: 'Bill Payment', title_hi: 'बिल भुगतान', title_bn: 'বিল পরিশোধ', title_as: 'বিল পৰিশোধ', desc_en: 'Pay your electricity bill online.', icon: '⚡', sort_order: 1 },
  { id: uuidv4(), category: 'electricity', title_en: 'New Connection', title_hi: 'नया कनेक्शन', title_bn: 'নতুন সংযোগ', title_as: 'নতুন সংযোগ', desc_en: 'Apply for a new electricity connection.', icon: '🔌', sort_order: 2 },
  { id: uuidv4(), category: 'electricity', title_en: 'Outage Report', title_hi: 'बिजली शिकायत', title_bn: 'বিদ্যুৎ অভিযোগ', title_as: 'বিদ্যুৎ অভিযোগ', desc_en: 'Report a power outage in your area.', icon: '🔦', sort_order: 3 },
  // Scholarship
  { id: uuidv4(), category: 'scholarship', title_en: 'Pre-Matric Scholarship', title_hi: 'प्री-मैट्रिक छात्रवृत्ति', title_bn: 'প্রি-ম্যাট্রিক বৃত্তি', title_as: 'প্ৰি-মেট্ৰিক বৃত্তি', desc_en: 'Scholarship for students in classes 1–10.', icon: '📚', sort_order: 1 },
  { id: uuidv4(), category: 'scholarship', title_en: 'Post-Matric Scholarship', title_hi: 'पोस्ट-मैट्रिक छात्रवृत्ति', title_bn: 'পোস্ট-ম্যাট্রিক বৃত্তি', title_as: 'পোষ্ট-মেট্ৰিক বৃত্তি', desc_en: 'Scholarship for students from class 11 onwards.', icon: '🎓', sort_order: 2 },
  { id: uuidv4(), category: 'scholarship', title_en: 'Orunodoi Scheme', title_hi: 'ओरुनोदोई योजना', title_bn: 'অরুণোদই প্রকল্প', title_as: 'অৰুণোদয় আঁচনি', desc_en: 'Financial assistance to economically backward families.', icon: '🌅', sort_order: 3 },
  // Other
  { id: uuidv4(), category: 'other', title_en: 'Income Certificate', title_hi: 'आय प्रमाण पत्र', title_bn: 'আয় সনদ', title_as: 'আয় প্ৰমাণপত্ৰ', desc_en: 'Apply for an income certificate from the concerned Circle Office.', icon: '💼', sort_order: 1 },
  { id: uuidv4(), category: 'other', title_en: 'Caste Certificate', title_hi: 'जाति प्रमाण पत्र', title_bn: 'জাতি সনদ', title_as: 'জাতি প্ৰমাণপত্ৰ', desc_en: 'Apply for SC/ST/OBC caste certificate.', icon: '📄', sort_order: 2 },
  { id: uuidv4(), category: 'other', title_en: 'Domicile Certificate', title_hi: 'निवास प्रमाण पत्र', title_bn: 'বসবাসের সনদ', title_as: 'বাসস্থান প্ৰমাণপত্ৰ', desc_en: 'Certificate of residence in Assam.', icon: '🏡', sort_order: 3 },
  { id: uuidv4(), category: 'other', title_en: 'Voter ID Application', title_hi: 'वोटर आईडी आवेदन', title_bn: 'ভোটার আইডি আবেদন', title_as: 'ভোটাৰ পৰিচয়পত্ৰ আবেদন', desc_en: 'Apply or update your voter identification card.', icon: '🗳️', sort_order: 4 },
];

const insertSvc = db.prepare(`INSERT OR IGNORE INTO services (id, category, title_en, title_hi, title_bn, title_as, desc_en, icon, sort_order) VALUES (?,?,?,?,?,?,?,?,?)`);
for (const s of services) insertSvc.run(s.id, s.category, s.title_en, s.title_hi, s.title_bn, s.title_as, s.desc_en, s.icon, s.sort_order);
console.log(`  ✅ ${services.length} services seeded`);

// ─── NOTICES ─────────────────────────────────────────────────────────────────
const notices = [
  { id: uuidv4(), title_en: 'Public Notice: Orunodoi 2.0 Scheme Beneficiary Verification', category: 'circular', department: 'Finance', content_en: 'All existing beneficiaries of the Orunodoi scheme are requested to complete biometric verification at their nearest CSC centre by March 15, 2026.', is_pinned: 1, published_at: '2026-02-20 10:00:00' },
  { id: uuidv4(), title_en: 'Recruitment Notice: Assam Police Constable 2026', category: 'recruitment', department: 'Home & Political', content_en: 'Applications are invited from eligible candidates for 6,674 posts of Constable in Assam Police. Last date for application: March 31, 2026.', is_pinned: 1, published_at: '2026-02-18 09:00:00' },
  { id: uuidv4(), title_en: 'Tender Notice: Construction of District Hospital Goalpara', category: 'tender', department: 'Health & Family Welfare', content_en: 'Sealed tenders are invited for the construction of a 100-bed district hospital at Goalpara. Estimated cost: ₹45 crore. Last date: March 25, 2026.', is_pinned: 0, published_at: '2026-02-15 11:00:00' },
  { id: uuidv4(), title_en: 'Order: Mandatory Use of AarogyaSetu App for State Employees', category: 'order', department: 'Health & Family Welfare', content_en: 'All state government employees are directed to install and activate the AarogyaSetu application on their mobile phones with immediate effect.', is_pinned: 0, published_at: '2026-02-12 08:00:00' },
  { id: uuidv4(), title_en: 'Circular: Academic Calendar 2026-27 for Secondary Schools', category: 'circular', department: 'Education', content_en: 'The academic calendar for the year 2026-27 for all secondary schools under the Board of Secondary Education, Assam (SEBA) is hereby published.', is_pinned: 0, published_at: '2026-02-10 14:00:00' },
  { id: uuidv4(), title_en: 'Gazette Notification: Assam Land Revenue Regulation (Amendment) 2026', category: 'gazette', department: 'Revenue & Disaster Management', content_en: 'The Governor of Assam is pleased to notify the Assam Land Revenue Regulation (Second Amendment) Act, 2026, with effect from February 1, 2026.', is_pinned: 0, published_at: '2026-02-01 10:00:00' },
  { id: uuidv4(), title_en: 'Recruitment: Junior Engineer (Civil) – PWD Assam 2026', category: 'recruitment', department: 'Public Works', content_en: 'PWD Assam invites applications for 312 posts of Junior Engineer (Civil). Qualification: Diploma/Degree in Civil Engineering. Apply online at pwdrecruitment.assam.gov.in.', is_pinned: 0, published_at: '2026-01-28 09:30:00' },
  { id: uuidv4(), title_en: 'Tender: Supply of Mid-Day Meal Foodgrains to Schools', category: 'tender', department: 'Education', content_en: 'Rate tenders are invited from registered FCI empanelled agencies for supply of rice and pulses to schools under the PM-POSHAN scheme in Kamrup Metro district.', is_pinned: 0, published_at: '2026-01-25 12:00:00' },
];

const insertNotice = db.prepare(`INSERT OR IGNORE INTO notices (id, title_en, category, department, content_en, is_pinned, published_at) VALUES (?,?,?,?,?,?,?)`);
for (const n of notices) insertNotice.run(n.id, n.title_en, n.category, n.department, n.content_en, n.is_pinned, n.published_at);
console.log(`  ✅ ${notices.length} notices seeded`);

// ─── QUICK LINKS ─────────────────────────────────────────────────────────────
const quickLinks = [
  { id: uuidv4(), title_en: 'RTI Online', title_hi: 'RTI ऑनलाइन', url: 'https://rti.assam.gov.in', icon: '📋', sort_order: 1 },
  { id: uuidv4(), title_en: 'Assam e-District', title_hi: 'ई-जिला', url: 'https://edistrict.assam.gov.in', icon: '🏢', sort_order: 2 },
  { id: uuidv4(), title_en: 'Voter Portal', title_hi: 'वोटर पोर्टल', url: 'https://voters.eci.gov.in', icon: '🗳️', sort_order: 3 },
  { id: uuidv4(), title_en: 'Assam DirectBenefit', title_hi: 'प्रत्यक्ष लाभ', url: 'https://dbt.assam.gov.in', icon: '💰', sort_order: 4 },
  { id: uuidv4(), title_en: 'APDCL Bill Pay', title_hi: 'बिजली बिल', url: 'https://apdcl.assam.gov.in', icon: '⚡', sort_order: 5 },
  { id: uuidv4(), title_en: 'Transport Portal', title_hi: 'परिवहन', url: 'https://transport.assam.gov.in', icon: '🚌', sort_order: 6 },
  { id: uuidv4(), title_en: 'Scholarship Portal', title_hi: 'छात्रवृत्ति', url: 'https://scholarships.gov.in', icon: '🎓', sort_order: 7 },
  { id: uuidv4(), title_en: 'Assam Tender', title_hi: 'निविदा', url: 'https://tender.assam.gov.in', icon: '📃', sort_order: 8 },
];

const insertQL = db.prepare(`INSERT OR IGNORE INTO quick_links (id, title_en, title_hi, url, icon, sort_order) VALUES (?,?,?,?,?,?)`);
for (const q of quickLinks) insertQL.run(q.id, q.title_en, q.title_hi, q.url, q.icon, q.sort_order);
console.log(`  ✅ ${quickLinks.length} quick links seeded`);

// ─── SITE STATS ───────────────────────────────────────────────────────────────
const stats = [
  ['services_online', '200+'],
  ['districts', '35'],
  ['departments', '60+'],
  ['citizens_served', '35M'],
];
const insertStat = db.prepare(`INSERT OR REPLACE INTO site_stats (key, value) VALUES (?,?)`);
for (const [k, v] of stats) insertStat.run(k, v);
console.log(`  ✅ Site stats seeded`);

console.log('\n🎉 Database seeding complete!');
db.close();
