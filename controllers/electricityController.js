const db = require('../config/database-simple');
const { generateReferenceNumber, calculateDueDate } = require('../utils/helpers');

/**
 * Apply for Electricity Connection
 * POST /api/electricity/apply
 */
exports.applyConnection = (req, res) => {
  try {
    const {
      connection_type,
      sanctioned_load,
      address,
      district
    } = req.body;

    if (!connection_type || !sanctioned_load || !address || !district) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const applicationNumber = generateReferenceNumber('EC');

    const result = db.insert('electricity_connections', {
      user_id: req.user.id,
      application_number: applicationNumber,
      connection_type,
      sanctioned_load,
      address,
      district,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Electricity connection application submitted successfully',
      data: {
        id: result.id,
        application_number: applicationNumber,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Apply Connection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

/**
 * Get User's Electricity Connections
 * GET /api/electricity/connections
 */
exports.getConnections = (req, res) => {
  try {
    let connections = db.find('electricity_connections', { user_id: req.user.id });

    // Sort by created_at DESC
    connections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      success: true,
      data: connections,
      count: connections.length
    });

  } catch (error) {
    console.error('Get Connections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections',
      error: error.message
    });
  }
};

/**
 * Get Electricity Bills
 * GET /api/electricity/bills
 */
exports.getBills = (req, res) => {
  try {
    const { status, connection_id } = req.query;

    const filter = { user_id: req.user.id };
    
    if (status) {
      filter.status = status;
    }
    
    if (connection_id) {
      filter.connection_id = parseInt(connection_id);
    }

    let bills = db.find('electricity_bills', filter);

    // Join with connections table
    bills = bills.map(bill => {
      const connection = db.findOne('electricity_connections', { id: bill.connection_id });
      return {
        ...bill,
        consumer_id: connection?.consumer_id,
        connection_type: connection?.connection_type
      };
    });

    // Sort by created_at DESC
    bills.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      success: true,
      data: bills,
      count: bills.length
    });

  } catch (error) {
    console.error('Get Bills Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

/**
 * Get Bill by Number
 * GET /api/electricity/bills/:billNumber
 */
exports.getBillByNumber = (req, res) => {
  try {
    const { billNumber } = req.params;

    const bill = db.findOne('electricity_bills', {
      bill_number: billNumber,
      user_id: req.user.id
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Join with connection data
    const connection = db.findOne('electricity_connections', { id: bill.connection_id });
    if (connection) {
      bill.consumer_id = connection.consumer_id;
      bill.meter_number = connection.meter_number;
      bill.connection_type = connection.connection_type;
      bill.address = connection.address;
    }

    res.status(200).json({
      success: true,
      data: bill
    });

  } catch (error) {
    console.error('Get Bill Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
      error: error.message
    });
  }
};

/**
 * Get Meter Readings
 * GET /api/electricity/readings/:connectionId
 */
exports.getMeterReadings = (req, res) => {
  try {
    const { connectionId } = req.params;

    // Verify connection belongs to user
    const connection = db.findOne('electricity_connections', {
      id: parseInt(connectionId),
      user_id: req.user.id
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    let readings = db.find('meter_readings', { connection_id: parseInt(connectionId) });

    // Sort by reading_date DESC and limit to 12
    readings.sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date));
    readings = readings.slice(0, 12);

    res.status(200).json({
      success: true,
      data: readings,
      count: readings.length
    });

  } catch (error) {
    console.error('Get Meter Readings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings',
      error: error.message
    });
  }
};

/**
 * Get Dashboard Stats
 * GET /api/electricity/dashboard
 */
exports.getDashboard = (req, res) => {
  try {
    const stats = {
      total_connections: db.count('electricity_connections', { user_id: req.user.id }),
      
      active_connections: db.count('electricity_connections', { 
        user_id: req.user.id, 
        status: 'active' 
      }),
      
      unpaid_bills: db.count('electricity_bills', { 
        user_id: req.user.id, 
        status: 'unpaid' 
      }),
      
      total_due: db.sum('electricity_bills', 'total_amount', { 
        user_id: req.user.id, 
        status: 'unpaid' 
      }) || 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};
