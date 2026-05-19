import express from 'express';
import mongoose from 'mongoose';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// All admin routes require admin auth
router.use(requireAdmin);

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────

// @route  GET /api/admin/stats
// @desc   Overview metrics for the dashboard header
router.get('/stats', async (_req, res) => {
  try {
    const [totalQuestions, totalUsers, premiumUsers, companies] = await Promise.all([
      Question.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      Question.distinct('companies'),
    ]);
    res.json({ totalQuestions, totalUsers, premiumUsers, totalCompanies: companies.length });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  GET /api/admin/companies
// @desc   All companies with their question count
router.get('/companies', async (_req, res) => {
  try {
    const companies: string[] = await Question.distinct('companies');
    const counts = await Promise.all(
      companies.map(async c => ({
        name:  c,
        count: await Question.countDocuments({ companies: c }),
      }))
    );
    // Sort by count descending
    counts.sort((a, b) => b.count - a.count);
    res.json({ companies: counts });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  DELETE /api/admin/companies/:company
// @desc   Remove a company from ALL questions; delete questions that become company-less
router.delete('/companies/:company', async (req, res) => {
  try {
    const { company } = req.params;

    // Pull the company name from every question's companies array
    await Question.updateMany(
      { companies: company },
      { $pull: { companies: company } }
    );

    // Delete questions that now have an empty companies array
    const { deletedCount } = await Question.deleteMany({ companies: { $size: 0 } });

    res.json({
      message: `Removed "${company}" bank. ${deletedCount} question(s) with no other companies were deleted.`,
      deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─────────────────────────────────────────────
// QUESTIONS CRUD
// ─────────────────────────────────────────────

// @route  GET /api/admin/questions
// @desc   Paginated + searchable list of all questions
router.get('/questions', async (req, res) => {
  try {
    const page     = parseInt(req.query.page as string)   || 1;
    const limit    = parseInt(req.query.limit as string)  || 25;
    const search   = (req.query.search as string)          || '';
    const company  = (req.query.company as string)         || '';
    const difficulty = (req.query.difficulty as string)    || '';

    const filter: Record<string, unknown> = {};
    if (search)     filter.title = { $regex: search, $options: 'i' };
    if (company)    filter.companies = company;
    if (difficulty) filter.difficulty = difficulty;

    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ frequency: -1 }).skip((page - 1) * limit).limit(limit),
      Question.countDocuments(filter),
    ]);

    res.json({ questions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  POST /api/admin/questions
// @desc   Create a new question
router.post('/questions', async (req, res) => {
  try {
    const { title, difficulty, frequency, acceptanceRate, link, topic, companies } = req.body;
    const question = await Question.create({
      title, difficulty, frequency, acceptanceRate, link,
      topic:     Array.isArray(topic)     ? topic     : topic?.split(',').map((t: string) => t.trim()),
      companies: Array.isArray(companies) ? companies : companies?.split(',').map((c: string) => c.trim()),
    });
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error });
  }
});

// @route  PUT /api/admin/questions/:id
// @desc   Update an existing question
router.put('/questions/:id', async (req, res) => {
  try {
    const { title, difficulty, frequency, acceptanceRate, link, topic, companies } = req.body;
    const update = {
      title, difficulty, frequency: Number(frequency), acceptanceRate: Number(acceptanceRate), link,
      topic:     Array.isArray(topic)     ? topic     : topic?.split(',').map((t: string) => t.trim()),
      companies: Array.isArray(companies) ? companies : companies?.split(',').map((c: string) => c.trim()),
    };
    const question = await Question.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error });
  }
});

// @route  DELETE /api/admin/questions/:id
// @desc   Delete a question
router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─────────────────────────────────────────────
// USERS MANAGEMENT
// ─────────────────────────────────────────────

// @route  GET /api/admin/users
// @desc   Paginated list of all users
router.get('/users', async (req, res) => {
  try {
    const page  = parseInt(req.query.page as string)  || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = (req.query.search as string) || '';

    const filter: Record<string, unknown> = {};
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email isPremium isAdmin solvedQuestions createdAt picture')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const usersWithCount = users.map(u => ({
      _id:          u._id,
      name:         u.name,
      email:        u.email,
      picture:      u.picture,
      isPremium:    u.isPremium,
      isAdmin:      u.isAdmin,
      solvedCount:  u.solvedQuestions?.length ?? 0,
      createdAt:    (u as any).createdAt,
    }));

    res.json({ users: usersWithCount, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  PUT /api/admin/users/:id/premium
// @desc   Toggle premium status for a user
router.put('/users/:id/premium', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isPremium = !user.isPremium;
    await user.save();
    res.json({ isPremium: user.isPremium });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route  PUT /api/admin/users/:id/admin
// @desc   Toggle admin status for a user
router.put('/users/:id/admin', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isAdmin = !user.isAdmin;
    await user.save();
    res.json({ isAdmin: user.isAdmin });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
