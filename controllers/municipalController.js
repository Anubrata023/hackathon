const db = require('../config/database-simple');
const { generateReferenceNumber } = require('../utils/helpers');

// ═══════════════════════════════════════════════
// WASTE MANAGEMENT
// ═══════════════════════════════════════════════

/**
 * Report Waste Issue
 * POST /api/municipal/waste/report
 */
exports.reportWaste = (req, res) => {
  try {
    const {
      location,
      ward_number,
      latitude,
      longitude,
      waste_type,
      description,
      priority
    } = req.body;

    if (!location || !waste_type) {
      return res.status(400).json({
        success: false,
        message: 'Location and waste type are required'
      });
    }

    const reportNumber = generateReferenceNumber('WR');

    const report = db.insert('waste_reports', {
      user_id: req.user.id,
      report_number: reportNumber,
      location,
      ward_number: ward_number || null,
      latitude: latitude || null,
      longitude: longitude || null,
      waste_type,
      description: description || null,
      priority: priority || 'normal',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Waste report submitted successfully',
      data: {
        id: report.id,
        report_number: reportNumber,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Report Waste Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit waste report',
      error: error.message
    });
  }
};

/**
 * Get Waste Reports
 * GET /api/municipal/waste/reports
 */
exports.getWasteReports = (req, res) => {
  try {
    const { status } = req.query;

    const filter = { user_id: req.user.id };
    if (status) filter.status = status;

    const reports = db.find('waste_reports', filter);

    res.status(200).json({
      success: true,
      data: reports,
      count: reports.length
    });

  } catch (error) {
    console.error('Get Waste Reports Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waste reports',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════
// GRIEVANCES (JAN SUNWAI)
// ═══════════════════════════════════════════════

/**
 * File Grievance
 * POST /api/municipal/grievance/file
 */
exports.fileGrievance = (req, res) => {
  try {
    const {
      category,
      subject,
      description,
      department,
      priority
    } = req.body;

    if (!category || !subject || !description || !department) {
      return res.status(400).json({
        success: false,
        message: 'Category, subject, description, and department are required'
      });
    }

    const grievanceNumber = generateReferenceNumber('GR');

    const grievance = db.insert('grievances', {
      user_id: req.user.id,
      grievance_number: grievanceNumber,
      category,
      subject,
      description,
      department,
      priority: priority || 'normal',
      status: 'submitted'
    });

    res.status(201).json({
      success: true,
      message: 'Grievance filed successfully',
      data: {
        id: grievance.id,
        grievance_number: grievanceNumber,
        status: 'submitted'
      }
    });

  } catch (error) {
    console.error('File Grievance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to file grievance',
      error: error.message
    });
  }
};

/**
 * Get Grievances
 * GET /api/municipal/grievance/my
 */
exports.getGrievances = (req, res) => {
  try {
    const { status } = req.query;

    const filter = { user_id: req.user.id };
    if (status) {
      filter.status = status;
    }

    let grievances = db.find('grievances', filter);

    // Sort by created_at DESC
    grievances.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      success: true,
      data: grievances,
      count: grievances.length
    });

  } catch (error) {
    console.error('Get Grievances Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grievances',
      error: error.message
    });
  }
};

/**
 * Track Grievance
 * GET /api/municipal/grievance/track/:grievanceNumber
 */
exports.trackGrievance = (req, res) => {
  try {
    const { grievanceNumber } = req.params;

    const grievance = db.findOne('grievances', {
      grievance_number: grievanceNumber,
      user_id: req.user.id
    });

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    res.status(200).json({
      success: true,
      data: grievance
    });

  } catch (error) {
    console.error('Track Grievance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track grievance',
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════
// WATER SUPPLY
// ═══════════════════════════════════════════════

/**
 * Apply for Water Connection
 * POST /api/municipal/water/apply
 */
exports.applyWaterConnection = (req, res) => {
  try {
    const {
      connection_type,
      property_type,
      address,
      ward_number
    } = req.body;

    if (!connection_type || !property_type || !address) {
      return res.status(400).json({
        success: false,
        message: 'Connection type, property type, and address are required'
      });
    }

    const applicationNumber = generateReferenceNumber('WC');

    const result = db.insert('water_connections', {
      user_id: req.user.id,
      application_number: applicationNumber,
      connection_type,
      property_type,
      address,
      ward_number: ward_number || null,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Water connection application submitted successfully',
      data: {
        id: result.id,
        application_number: applicationNumber,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Apply Water Connection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

/**
 * Get Water Connections
 * GET /api/municipal/water/connections
 */
exports.getWaterConnections = (req, res) => {
  try {
    let connections = db.find('water_connections', { user_id: req.user.id });

    // Sort by created_at DESC
    connections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      success: true,
      data: connections,
      count: connections.length
    });

  } catch (error) {
    console.error('Get Water Connections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections',
      error: error.message
    });
  }
};

/**
 * Get Water Bills
 * GET /api/municipal/water/bills
 */
exports.getWaterBills = (req, res) => {
  try {
    const { status } = req.query;

    const filter = { user_id: req.user.id };
    if (status) {
      filter.status = status;
    }

    let bills = db.find('water_bills', filter);

    // Sort by created_at DESC
    bills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      success: true,
      data: bills,
      count: bills.length
    });

  } catch (error) {
    console.error('Get Water Bills Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};
