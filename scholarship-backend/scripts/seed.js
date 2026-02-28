// scripts/seed.js
// Seeds the database with sample scholarships, notices, and an admin user

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const scholarships = [
  {
    slug: 'pragyan-bharati-2025-26',
    name: 'Pragyan Bharati Free Textbook Scheme',
    shortName: 'Pragyan Bharati',
    issuer: 'Assam Higher Education Dept.',
    description: 'Free textbooks and ₹5,000 annual scholarship for meritorious students in Higher Secondary institutions across Assam. Covers all streams – Arts, Science and Commerce.',
    status: 'ACTIVE',
    isFeatured: true,
    eligibleCategories: [],  // All categories
    eligibleIncomeGroups: ['BELOW_1L','BELOW_2L','BELOW_3_5L'],
    eligibleAcademicLevels: ['POST_MATRIC'],
    minPercentage: 60,
    requiresDistrict: false,
    onlyForGirls: false,
    amountPerYear: 5000,
    amountFrequency: 'yearly',
    totalSeats: 5000,
    seatsRemaining: 3247,
    applicationStartDate: new Date('2025-11-01'),
    applicationEndDate: new Date('2026-03-05'),
    academicYear: '2025-26',
    requiredDocuments: ['MARKSHEET','INCOME_CERTIFICATE','AADHAAR','PHOTO','BANK_PASSBOOK'],
    nspSchemeCode: 'PB-ASSAM-2526',
    iconType: 'book',
  },
  {
    slug: 'pre-matric-sc-scholarship-2025-26',
    name: 'Pre-Matric Scholarship for SC Students',
    shortName: 'Pre-Matric SC',
    issuer: 'SJED, Govt. of Assam',
    description: 'Ministry of Social Justice & Empowerment funded scholarship for Class 9 & 10 SC students to reduce dropout rate and support educational continuity.',
    status: 'CLOSING_SOON',
    isFeatured: false,
    eligibleCategories: ['SC'],
    eligibleIncomeGroups: ['BELOW_2L','BELOW_1L'],
    eligibleAcademicLevels: ['PRE_MATRIC'],
    requiresDistrict: false,
    amountPerYear: 3500,
    amountFrequency: 'yearly',
    totalSeats: 2000,
    seatsRemaining: 120,
    applicationStartDate: new Date('2025-11-15'),
    applicationEndDate: new Date('2026-02-28'),
    academicYear: '2025-26',
    requiredDocuments: ['MARKSHEET','INCOME_CERTIFICATE','CASTE_CERTIFICATE','AADHAAR','PHOTO'],
    iconType: 'award',
  },
  {
    slug: 'nmms-2025-26',
    name: 'National Means-cum-Merit Scholarship (NMMS)',
    shortName: 'NMMS',
    issuer: 'Directorate of Secondary Education',
    description: 'Central government scholarship of ₹12,000/year for meritorious students from economically weaker sections. Awarded after a two-stage examination.',
    status: 'ACTIVE',
    isFeatured: false,
    eligibleCategories: [],
    eligibleIncomeGroups: ['BELOW_1L','BELOW_2L'],
    eligibleAcademicLevels: ['PRE_MATRIC'],
    minPercentage: 55,
    requiresDistrict: false,
    amountPerYear: 12000,
    amountFrequency: 'yearly',
    totalSeats: 1000,
    seatsRemaining: 612,
    applicationStartDate: new Date('2025-12-01'),
    applicationEndDate: new Date('2026-03-05'),
    academicYear: '2025-26',
    requiredDocuments: ['MARKSHEET','INCOME_CERTIFICATE','AADHAAR','PHOTO'],
    nspSchemeCode: 'NMMS-ASSAM-2526',
    iconType: 'star',
  },
  {
    slug: 'orunodoi-girls-scholarship-2025-26',
    name: 'Orunodoi Girls Scholarship',
    shortName: 'Orunodoi Girls',
    issuer: 'Assam Welfare Department',
    description: 'New initiative to support girls from economically backward families pursuing higher education. Covers tuition fees and provides a monthly stipend.',
    status: 'ACTIVE',
    isFeatured: false,
    eligibleCategories: ['GENERAL','OBC','SC','ST','EWS'],
    eligibleIncomeGroups: ['BELOW_1L','BELOW_2L','BELOW_3_5L'],
    eligibleAcademicLevels: ['POST_MATRIC','GRADUATION'],
    onlyForGirls: true,
    requiresDistrict: false,
    amountPerYear: 10000,
    amountFrequency: 'yearly',
    totalSeats: 3000,
    seatsRemaining: 2800,
    applicationStartDate: new Date('2026-03-01'),
    applicationEndDate: new Date('2026-05-31'),
    academicYear: '2025-26',
    requiredDocuments: ['MARKSHEET','INCOME_CERTIFICATE','AADHAAR','PHOTO','BANK_PASSBOOK'],
    iconType: 'heart',
  },
  {
    slug: 'cm-special-scholarship-2024-25',
    name: "Chief Minister's Special Scholarship",
    shortName: "CM Special",
    issuer: 'GMC Education Cell',
    description: "City-level merit scholarship for students securing above 85% in Class 10 board exams from schools within Guwahati Municipal Corporation limits.",
    status: 'CLOSED',
    isFeatured: false,
    eligibleCategories: [],
    eligibleIncomeGroups: [],
    eligibleAcademicLevels: ['POST_MATRIC'],
    minPercentage: 85,
    requiresDistrict: true,
    amountPerYear: 15000,
    amountFrequency: 'yearly',
    totalSeats: 500,
    seatsRemaining: 0,
    applicationStartDate: new Date('2024-08-01'),
    applicationEndDate: new Date('2024-11-30'),
    academicYear: '2024-25',
    requiredDocuments: ['MARKSHEET','AADHAAR','PHOTO','DOMICILE'],
    iconType: 'trophy',
  },
  {
    slug: 'st-post-matric-scholarship-2025-26',
    name: 'Post-Matric Scholarship for ST Students',
    shortName: 'Post-Matric ST',
    issuer: 'Tribal Affairs, Govt. of Assam',
    description: 'Scholarship for Scheduled Tribe students pursuing post-secondary education. Covers maintenance allowance, study tour, thesis, and book grants.',
    status: 'ACTIVE',
    isFeatured: false,
    eligibleCategories: ['ST'],
    eligibleIncomeGroups: ['BELOW_2L','BELOW_3_5L','BELOW_1L'],
    eligibleAcademicLevels: ['POST_MATRIC','GRADUATION','POST_GRADUATION','DIPLOMA'],
    requiresDistrict: false,
    amountPerYear: 8000,
    amountFrequency: 'yearly',
    totalSeats: 1500,
    seatsRemaining: 890,
    applicationStartDate: new Date('2025-10-01'),
    applicationEndDate: new Date('2026-02-28'),
    academicYear: '2025-26',
    requiredDocuments: ['MARKSHEET','INCOME_CERTIFICATE','CASTE_CERTIFICATE','AADHAAR','PHOTO','BANK_PASSBOOK'],
    iconType: 'users',
  },
];

const notices = [
  {
    slug: 'nmms-deadline-extended-march-2026',
    title: 'NMMS Application deadline extended to 5 March 2026',
    body: 'The National Means-cum-Merit Scholarship application deadline has been extended to 5 March 2026. Students must submit their completed applications before midnight. Incomplete applications will not be considered.',
    tag: 'DEADLINE',
    issuedBy: 'Directorate of Secondary Education',
    isPinned: true,
    publishedAt: new Date('2026-02-26'),
    expiresAt: new Date('2026-03-05'),
  },
  {
    slug: 'pragyan-bharati-renewal-open-2026',
    title: 'Pragyan Bharati FY 2025–26: Renewal applications now open',
    body: 'Students who received the Pragyan Bharati scholarship in FY 2024-25 may now apply for renewal on the National Scholarship Portal. Ensure your bank details are updated before applying.',
    tag: 'NOTICE',
    issuedBy: 'Assam Higher Education Dept.',
    isPinned: false,
    publishedAt: new Date('2026-02-24'),
  },
  {
    slug: 'cm-special-merit-list-published-2024-25',
    title: "CM Special Scholarship 2024–25 merit list published",
    body: '412 students from Guwahati have been selected for the Chief Minister\'s Special Scholarship 2024–25. The merit list is available on the GMC Education Cell website. Selected students must verify their bank account details by 15 March 2026.',
    tag: 'RESULT',
    issuedBy: 'GMC Education Cell',
    isPinned: false,
    publishedAt: new Date('2026-02-22'),
  },
  {
    slug: 'orunodoi-girls-scholarship-launched-2025-26',
    title: 'Orunodoi Girls Scholarship 2025–26 launched',
    body: 'The Assam Welfare Department has launched the Orunodoi Girls Scholarship for 2025–26. Applications open from 1 March 2026. This scholarship supports girls from economically backward families pursuing post-secondary education.',
    tag: 'NEW',
    issuedBy: 'Assam Welfare Department',
    isPinned: false,
    publishedAt: new Date('2026-02-20'),
  },
  {
    slug: 'pre-matric-sc-incomplete-alert-2026',
    title: 'Alert: Incomplete Pre-Matric SC Scholarship applications will be rejected',
    body: 'Students who have submitted incomplete applications for the Pre-Matric SC Scholarship are advised to complete their submissions immediately. Applications without all required documents will be summarily rejected after 28 February 2026.',
    tag: 'ALERT',
    issuedBy: 'SJED, Govt. of Assam',
    isPinned: true,
    publishedAt: new Date('2026-02-18'),
    expiresAt: new Date('2026-02-28'),
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where:  { phone: '9000000000' },
    update: {},
    create: {
      phone:        '9000000000',
      email:        'admin@gmcscholarship.in',
      passwordHash: adminHash,
      role:         'SUPER_ADMIN',
      isActive:     true,
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email} | Phone: ${admin.phone} | Password: Admin@1234`);

  // Create demo student user
  const studentHash = await bcrypt.hash('Student@1234', 12);
  const student = await prisma.user.upsert({
    where:  { phone: '9876543210' },
    update: {},
    create: {
      phone:           '9876543210',
      email:           'student@example.com',
      passwordHash:    studentHash,
      role:            'STUDENT',
      isPhoneVerified: true,
    },
  });

  // Create demo student profile
  await prisma.studentProfile.upsert({
    where:  { userId: student.id },
    update: {},
    create: {
      userId:       student.id,
      firstName:    'Priya',
      lastName:     'Deka',
      dob:          new Date('2006-05-14'),
      gender:       'FEMALE',
      category:     'OBC',
      incomeGroup:  'BELOW_2L',
      academicLevel: 'POST_MATRIC',
      institution:  'Cotton College Govt. Higher Secondary School',
      course:       'Higher Secondary (Science)',
      yearOfStudy:  1,
      percentage:   78.5,
      district:     'Kamrup Metropolitan',
      address:      'Guwahati, Assam',
      pincode:      '781001',
      isMinority:   false,
      isDisabled:   false,
    },
  });
  console.log(`✅ Student user: ${student.phone} | Password: Student@1234`);

  // Seed scholarships
  for (const s of scholarships) {
    await prisma.scholarship.upsert({
      where:  { slug: s.slug },
      update: s,
      create: s,
    });
  }
  console.log(`✅ ${scholarships.length} scholarships seeded`);

  // Seed notices
  for (const n of notices) {
    await prisma.notice.upsert({
      where:  { slug: n.slug },
      update: n,
      create: n,
    });
  }
  console.log(`✅ ${notices.length} notices seeded`);

  console.log('\n🎉 Seeding complete!');
  console.log('─────────────────────────────────');
  console.log('Admin login: POST /api/v1/auth/login');
  console.log('  email:    admin@gmcscholarship.in');
  console.log('  password: Admin@1234');
  console.log('Student OTP: POST /api/v1/auth/otp/send  { phone: "9876543210" }');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
