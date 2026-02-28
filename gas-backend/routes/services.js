const router           = require('express').Router();
const ctrl             = require('../controllers/serviceController');
const { authenticate } = require('../middleware/auth');

router.get('/types',   ctrl.getServiceTypes);
router.post('/',       authenticate, ctrl.createRequest);
router.get('/',        authenticate, ctrl.getMyRequests);
router.get('/:id',     authenticate, ctrl.getRequestById);
router.delete('/:id',  authenticate, ctrl.cancelRequest);

module.exports = router;
