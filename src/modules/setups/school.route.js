import { Router } from 'express';
import schoolController from './school.controller.js';

const router = Router();

router.route('/').post(schoolController.createSchool);

export default router;
