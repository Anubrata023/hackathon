// src/routes/complaints.js
const express = require('express');
const router = express.Router();
const { getComplaints, raiseComplaint, updateComplaintStatus } = require('../controllers/complaintsController');

router.get('/:consumerId', getComplaints);
router.post('/:consumerId', raiseComplaint);
router.patch('/:consumerId/:complaintId/status', updateComplaintStatus);

module.exports = router;
