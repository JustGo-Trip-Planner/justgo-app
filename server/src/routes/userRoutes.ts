import express from 'express';
import { searchUsers, updateUser } from '../controllers/userController';

const router = express.Router();

router.get("/search", searchUsers);
router.put('/:id', updateUser);

export default router;
