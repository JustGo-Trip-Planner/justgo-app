import express from 'express';
import { getAllProvinces, getProvinceById, searchProvinces } from '../controllers/provinceController';

const router = express.Router();

router.get('/', getAllProvinces);
router.get('/search', searchProvinces);
router.get('/:id', getProvinceById);

export default router;
