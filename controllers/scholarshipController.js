const db = require('../config/database-simple');
const { generateReferenceNumber } = require('../utils/helpers');

/**
 * Get All Available Scholarships
 * GET /api/scholarships
 */
exports.getScholarships = (req, res) => {
  try {
    const { category, is_active } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (is_active !== undefined) {
      filter.is_active = is_active === 'true' ? 1 : 0;
    }

    let scholarships = db.find('scholarships', filter);

    // Sort by deadline ASC
    scholarships.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    res.status(200).json({
      success: true,
      data: scholarships,
      count: scholarships.length
    });

  } catch (error) {
    console.error('Get Scholarships Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scholarships',
      error: error.message
    });
  }
};

/**
 * Get Scholarship by ID
 * GET /api/scholarships/:id
 */
exports.getScholarshipById = (req, res) => {
  try {
    const { id } = req.params;

    const scholarship = db.findOne('scholarships', { id: parseInt(id) });

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found'
      });
    }

    res.status(200).json({
      success: true,
      data: scholarship
    });

  } catch (error) {
    console.error('Get Scholarship Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scholarship',
      error: error.message
    });
  }
};

/**
 * Apply for Scholarship
 * POST /api/scholarships/apply
 */
exports.applyScholarship = (req, res) => {
  try {
    const {
      scholarship_id,
      student_name,
      father_name,
      mother_name,
      dob,
      gender,
      category,
      annual_income,
      class_level,
      school_college,
      marks_percentage,
      bank_account,
      ifsc_code,
      documents
    } = req.body;

    // Validate required fields
    if (!scholarship_id || !student_name || !father_name || !mother_name || 
        !dob || !gender || !category || !annual_income || !class_level || 
        !school_college || !marks_percentage || !bank_account || !ifsc_code) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if scholarship exists
    const scholarship = db.findOne('scholarships', { 
      id: parseInt(scholarship_id), 
      is_active: 1 
    });

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found or not active'
      });
    }

    // Check if deadline has passed
    if (new Date(scholarship.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scholarship deadline has passed'
      });
    }

    // Check if user has already applied
    const existingApplication = db.findOne('scholarship_applications', {
      user_id: req.user.id,
      scholarship_id: parseInt(scholarship_id)
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this scholarship'
      });
    }

    const applicationNumber = generateReferenceNumber('SC');

    const result = db.insert('scholarship_applications', {
      user_id: req.user.id,
      scholarship_id: parseInt(scholarship_id),
      application_number: applicationNumber,
      student_name,
      father_name,
      mother_name,
      dob,
      gender,
      category,
      annual_income,
      class_level,
      school_college,
      marks_percentage,
      bank_account,
      ifsc_code,
      documents_json: documents ? JSON.stringify(documents) : null,
      status: 'submitted'
    });

    res.status(201).json({
      success: true,
      message: 'Scholarship application submitted successfully',
      data: {
        id: result.id,
        application_number: applicationNumber,
        scholarship_name: scholarship.name,
        status: 'submitted'
      }
    });

  } catch (error) {
    console.error('Apply Scholarship Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

/**
 * Get User's Applications
 * GET /api/scholarships/my-applications
 */
exports.getMyApplications = (req, res) => {
  try {
    const { status } = req.query;

    const filter = { user_id: req.user.id };
    if (status) {
      filter.status = status;
    }

    let applications = db.find('scholarship_applications', filter);

    // Join with scholarships table
    applications = applications.map(app => {
      const scholarship = db.findOne('scholarships', { id: app.scholarship_id });
      
      // Parse documents JSON if exists
      let documents = null;
      if (app.documents_json) {
        try {
          documents = JSON.parse(app.documents_json);
        } catch (e) {
          documents = null;
        }
      }
      
      // Create new object without documents_json
      const { documents_json, ...appWithoutDocsJson } = app;
      
      return {
        ...appWithoutDocsJson,
        ...(documents && { documents }),
        scholarship_name: scholarship?.name,
        amount: scholarship?.amount,
        scholarship_category: scholarship?.category
      };
    });

    // Sort by created_at DESC
    applications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      success: true,
      data: applications,
      count: applications.length
    });

  } catch (error) {
    console.error('Get Applications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

/**
 * Track Application
 * GET /api/scholarships/track/:applicationNumber
 */
exports.trackApplication = (req, res) => {
  try {
    const { applicationNumber } = req.params;

    const application = db.findOne('scholarship_applications', {
      application_number: applicationNumber,
      user_id: req.user.id
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Join with scholarship data
    const scholarship = db.findOne('scholarships', { id: application.scholarship_id });
    application.scholarship_name = scholarship?.name;
    application.amount = scholarship?.amount;
    application.description = scholarship?.description;

    // Parse documents JSON
    if (application.documents_json) {
      application.documents = JSON.parse(application.documents_json);
      delete application.documents_json;
    }

    res.status(200).json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Track Application Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track application',
      error: error.message
    });
  }
};

/**
 * Check Eligibility
 * POST /api/scholarships/check-eligibility
 */
exports.checkEligibility = (req, res) => {
  try {
    const { annual_income, class_level, marks_percentage, category } = req.body;

    let eligibleScholarships = db.find('scholarships', { is_active: 1 });

    // Filter by deadline - only future deadlines
    const now = new Date();
    eligibleScholarships = eligibleScholarships.filter(s => new Date(s.deadline) > now);

    // Sort by amount DESC
    eligibleScholarships.sort((a, b) => b.amount - a.amount);

    // Simple eligibility logic (can be enhanced)
    const suggestions = eligibleScholarships.filter(scholarship => {
      if (scholarship.category === 'Merit' && marks_percentage >= 60) return true;
      if (scholarship.category === 'Merit-cum-Means' && marks_percentage >= 75 && annual_income < 150000) return true;
      return scholarship.category !== 'Merit' && scholarship.category !== 'Merit-cum-Means';
    });

    res.status(200).json({
      success: true,
      message: `Found ${suggestions.length} eligible scholarships`,
      data: suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('Check Eligibility Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
};
