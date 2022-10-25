import { Router } from 'express';
import schoolController from './school.controller.js';
import auth from '../../middlewares/auth.js';

const router = Router();

router.post('/', schoolController.createSchool).get('/', schoolController.getSchools);

router
  .get('/:id', schoolController.getOneSchoolById)
  .get('/tenant/:schoolId', auth('/tenant/:schoolId'), schoolController.getOneSchoolByTenantId)
  .get('/e/:emailId', auth('/e/:emailId'), schoolController.getOneSchoolByEmail);

export default router;
