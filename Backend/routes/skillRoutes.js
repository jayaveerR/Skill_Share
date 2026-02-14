const express = require('express');
const { getSkills, createSkill, deleteSkill, trackSkillView } = require('../controllers/skillController');
const { protect, optionalProtect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .get(optionalProtect, getSkills)
    .post(protect, createSkill);

router.post('/:id/view', optionalProtect, trackSkillView);

router.route('/:id')
    .delete(protect, deleteSkill);

module.exports = router;
