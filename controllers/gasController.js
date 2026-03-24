const db = require('../config/database-simple');
const { generateReferenceNumber } = require('../utils/helpers');

/**
 * Apply for Gas Connection
 * POST /api/gas/apply
 */
exports.applyConnection = (req, res) => {
  try {
    const {
      connection_type,
      distributor,
      address
    } = req.body;

    if (!connection_type || !address) {
      return res.status(400).json({
        success: false,
        message: 'Connection type and address are required'
      });
    }

    const applicationNumber = generateReferenceNumber('GC');

    const result = db.insert('gas_connections', {
      user_id: req.user.id,
      application_number: applicationNumber,
      connection_type,
      distributor: distributor || null,
      address,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Gas connection application submitted successfully',
      data: {
        id: result.id,
        application_number: applicationNumber,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Apply Gas Connection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

/**
 * Get Gas Connections
 * GET /api/gas/connections
 */
exports.getConnections = (req, res) => {
  try {
    let connections = db.find('gas_connections', { user_id: req.user.id });

    // Sort by created_at DESC
    connections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      success: true,
      data: connections,
      count: connections.length
    });

  } catch (error) {
    console.error('Get Gas Connections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections',
      error: error.message
    });
  }
};

/**
 * Book LPG Cylinder
 * POST /api/gas/book
 */
exports.bookCylinder = (req, res) => {
  try {
    const {
      connection_id,
      cylinder_type,
      quantity,
      delivery_address
    } = req.body;

    if (!connection_id || !cylinder_type || !delivery_address) {
      return res.status(400).json({
        success: false,
        message: 'Connection ID, cylinder type, and delivery address are required'
      });
    }

    // Verify connection belongs to user
    const connection = db.findOne('gas_connections', {
      id: parseInt(connection_id),
      user_id: req.user.id
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    if (connection.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Connection is not active'
      });
    }

    const bookingNumber = generateReferenceNumber('GB');
    
    // Calculate amount based on cylinder type
    const amount = cylinder_type === '14.2kg' ? 903 : 1103;

    const result = db.insert('gas_bookings', {
      connection_id: parseInt(connection_id),
      user_id: req.user.id,
      booking_number: bookingNumber,
      cylinder_type,
      quantity: quantity || 1,
      delivery_address,
      amount: amount * (quantity || 1),
      status: 'booked'
    });

    res.status(201).json({
      success: true,
      message: 'LPG cylinder booked successfully',
      data: {
        id: result.id,
        booking_number: bookingNumber,
        amount: amount * (quantity || 1),
        status: 'booked',
        estimated_delivery: '3-5 days'
      }
    });

  } catch (error) {
    console.error('Book Cylinder Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book cylinder',
      error: error.message
    });
  }
};

/**
 * Get Gas Bookings
 * GET /api/gas/bookings
 */
exports.getBookings = (req, res) => {
  try {
    const { status } = req.query;

    const filter = { user_id: req.user.id };
    if (status) {
      filter.status = status;
    }

    let bookings = db.find('gas_bookings', filter);

    // Join with connections table
    bookings = bookings.map(booking => {
      const connection = db.findOne('gas_connections', { id: booking.connection_id });
      return {
        ...booking,
        consumer_id: connection?.consumer_id,
        distributor: connection?.distributor
      };
    });

    // Sort by booked_at DESC
    bookings.sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at));

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error('Get Bookings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

/**
 * Track Booking
 * GET /api/gas/track/:bookingNumber
 */
exports.trackBooking = (req, res) => {
  try {
    const { bookingNumber } = req.params;

    const booking = db.findOne('gas_bookings', {
      booking_number: bookingNumber,
      user_id: req.user.id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Join with connection data
    const connection = db.findOne('gas_connections', { id: booking.connection_id });
    if (connection) {
      booking.consumer_id = connection.consumer_id;
      booking.distributor = connection.distributor;
      booking.connection_address = connection.address;
    }

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Track Booking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track booking',
      error: error.message
    });
  }
};
