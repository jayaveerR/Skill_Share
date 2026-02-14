const express = require('express');
const { createRating, getUserRatings } = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createRating);
router.get('/user/:userId', getUserRatings);

module.exports = router;
