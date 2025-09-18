import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { listSuggestions, generateSuggestions, acceptSuggestion, declineSuggestion, joinWaitlist, inviteTopCandidate, confirmInvite, getConfig, updateConfig } from '../controllers/overbookController.js';

const router = express.Router();

// Public confirmation endpoint (no auth)
router.post('/waitlist/confirm', confirmInvite);
router.get('/waitlist/confirm', confirmInvite);

// Authenticated routes
router.use(authenticate);
router.get('/suggestions', listSuggestions);
router.post('/suggestions/generate', generateSuggestions);
router.post('/suggestions/:id/accept', acceptSuggestion);
router.post('/suggestions/:id/decline', declineSuggestion);
router.post('/waitlist', joinWaitlist);
router.post('/waitlist/invite', inviteTopCandidate);
router.get('/config', getConfig);
router.patch('/config', updateConfig);

export default router;
