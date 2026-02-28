const router           = require('express').Router();
const ctrl             = require('../controllers/connectionController');
const { authenticate } = require('../middleware/auth');

router.get('/',        authenticate, ctrl.getMyConnections);
router.get('/:id',     authenticate, ctrl.getConnectionById);
router.post('/apply',  authenticate, ctrl.applyNewConnection);

module.exports = router;
