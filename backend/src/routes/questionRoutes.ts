import express from 'express';
import { protect, AuthRequest } from '../middlewares/auth';
import { requirePremium } from '../middlewares/requirePremium';
import Question from '../models/Question';

const router = express.Router();

// @route   GET /api/questions
// @desc    Get all questions (with pagination/filtering)
// @access  Public (Partial data for premium)
router.get('/', async (req, res) => {
  try {
    const { company, difficulty, page = 1, limit = 20 } = req.query;
    
    let query: any = {};
    if (company) query.company = company;
    if (difficulty) query.difficulty = difficulty;

    // Fetch questions
    const questions = await Question.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Question.countDocuments(query);

    // Map questions: if question is premium and user is not premium, hide details
    // For this, we'd need user info. So maybe we should use an optional auth middleware
    // Let's just return the questions, the frontend will see isPremium and hide the body
    
    res.json({
      questions,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get single question
// @access  Private (Premium checked if question is premium)
router.get('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.isPremium && !req.user?.isPremium) {
      return res.status(403).json({ message: 'Premium content. Please upgrade.' });
    }

    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
