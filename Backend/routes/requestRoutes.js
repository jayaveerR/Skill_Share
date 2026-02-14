const express = require('express');
const { createRequest, getRequests, updateRequestStatus } = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All request routes are protected

router.route('/')
    .post(createRequest)
    .get(getRequests);

router.route('/:id')
    .put(updateRequestStatus);

module.exports = router;
