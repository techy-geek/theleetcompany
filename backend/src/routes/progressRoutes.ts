import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Question from '../models/Question.js';

const router = express.Router();

// Inline auth guard — reads JWT cookie, attaches user
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies?.jwt;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user    = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// @route   GET /api/progress
// @desc    Returns the list of solved question IDs for the current user
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const solvedIds = req.user.solvedQuestions.map((id: mongoose.Types.ObjectId) => id.toString());
    res.json({ solvedIds });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/progress/stats
// @desc    Returns solved count broken down by difficulty for the dashboard chart
router.get('/stats', requireAuth, async (req: any, res) => {
  try {
    const solvedIds = req.user.solvedQuestions as mongoose.Types.ObjectId[];

    if (solvedIds.length === 0) {
      return res.json({ total: 0, easy: 0, medium: 0, hard: 0, solvedIds: [] });
    }

    const solved = await Question.find({ _id: { $in: solvedIds } }).select('difficulty');

    const stats = { total: 0, easy: 0, medium: 0, hard: 0 };
    for (const q of solved) {
      stats.total++;
      if (q.difficulty === 'Easy')   stats.easy++;
      if (q.difficulty === 'Medium') stats.medium++;
      if (q.difficulty === 'Hard')   stats.hard++;
    }

    res.json({ ...stats, solvedIds: solvedIds.map(id => id.toString()) });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/progress/toggle/:questionId
// @desc    Toggle a question solved / unsolved for the current user
router.post('/toggle/:questionId', requireAuth, async (req: any, res) => {
  try {
    const { questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const user     = req.user;
    const objectId = new mongoose.Types.ObjectId(questionId);

    const alreadySolved = (user.solvedQuestions as mongoose.Types.ObjectId[])
      .some(id => id.toString() === questionId);

    if (alreadySolved) {
      user.solvedQuestions = (user.solvedQuestions as mongoose.Types.ObjectId[])
        .filter(id => id.toString() !== questionId);
    } else {
      user.solvedQuestions.push(objectId);
    }

    await user.save();

    res.json({
      solved:       !alreadySolved,
      solvedCount:  user.solvedQuestions.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
