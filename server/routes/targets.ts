import express from 'express';
import db from '../db';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/', (_req, res) => {
  try {
    const targets = db.prepare('SELECT * FROM targets').all();
    res.json({ targets });
  } catch (err) {
    console.error('Database error on targets:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.patch('/:id', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    
    // basic validation
    if (!id || typeof id !== 'string' || !id.match(/^[a-zA-Z0-9_-]+$/)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    if (typeof score !== 'number' || score < 0 || score > 1) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    
    const result = db.prepare('UPDATE targets SET score = @score WHERE id = @id').run({ id, score });
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update target:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
