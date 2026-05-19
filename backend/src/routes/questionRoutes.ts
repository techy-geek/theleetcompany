import express from 'express';
import Question from '../models/Question.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// ── Freemium constants ──────────────────────────────────────────────────────
const FREE_QUESTION_LIMIT = 10;   // First N questions per company are free (with links)

// @route   GET /api/questions/companies
// @desc    Returns all companies — all accessible to free users (first 10 questions each)
router.get('/companies', optionalAuth, async (req, res) => {
  try {
    const isPremium = (req as any).user?.isPremium ?? false;
    const all: string[] = await Question.distinct('companies');

    res.json({
      companies:    all,
      freeCompanies: all,   // every company is now accessible
      isPremium,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/questions
// @desc    Get questions
//          Free users: first FREE_QUESTION_LIMIT per company (links included)
//          Premium: all questions for all companies
router.get('/', optionalAuth, async (req, res) => {
  try {
    const isPremium = (req as any).user?.isPremium ?? false;
    const { company } = req.query;

    // Build query filter
    const filter: Record<string, unknown> = {};
    if (company) filter.companies = company;

    const allQuestions = await Question.find(filter).sort({ frequency: -1 });
    const total = allQuestions.length;

    if (!isPremium) {
      // Free plan: first FREE_QUESTION_LIMIT questions with links included
      return res.json({
        questions: allQuestions.slice(0, FREE_QUESTION_LIMIT),
        total,
        hasMore:   total > FREE_QUESTION_LIMIT,
        freeLimit: FREE_QUESTION_LIMIT,
        isPremium: false,
      });
    }

    // Premium: return everything
    res.json({
      questions: allQuestions,
      total,
      hasMore:   false,
      isPremium: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get a single question by its MongoDB ID
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
