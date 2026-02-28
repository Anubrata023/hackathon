// src/routes/notice.routes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/notice.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate   = require('../middleware/validate');
const schema     = require('../validators/notice.validator');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', cacheMiddleware(30), controller.listNotices);
router.get('/:slug', controller.getNotice);

router.post('/',
  authenticate, authorize('ADMIN', 'SUPER_ADMIN'),
  validate(schema.create), controller.createNotice
);
router.put('/:id',
  authenticate, authorize('ADMIN', 'SUPER_ADMIN'),
  validate(schema.update), controller.updateNotice
);
router.delete('/:id',
  authenticate, authorize('SUPER_ADMIN'),
  controller.deleteNotice
);

module.exports = router;
