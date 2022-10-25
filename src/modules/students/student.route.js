import { Router } from 'express';
import studentController from './student.controller.js';
import auth from '../../middlewares/auth.js';

const router = Router();

router.post('/', studentController.createStudent);

router.get('/', studentController.getAllStudents).get('/:studentId', studentController.getStudentById);

router.put('/:studentId', studentController.updateStudent);

export default router;
