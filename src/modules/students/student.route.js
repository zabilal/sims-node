import { Router } from 'express';
import studentController from './student.controller.js';
import auth from '../../middlewares/auth.js';

const router = Router();

router.post('/', studentController.createStudent).get('/', studentController.getAllStudents);

export default router;