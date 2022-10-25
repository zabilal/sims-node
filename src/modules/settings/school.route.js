import { Router } from 'express';
import schoolController from './school.controller.js';
import auth from '../../middlewares/auth.js';

const router = Router();

router.post('/', schoolController.createSchool);

router
  .get('/', schoolController.getSchools)
  .get('/:id', schoolController.getOneSchoolById)
  .get('/tenant/:schoolId', auth('/tenant/:schoolId'), schoolController.getOneSchoolByTenantId)
  .get('/e/:emailId', auth('/e/:emailId'), schoolController.getOneSchoolByEmail);

router.put('/:schoolId', schoolController.updateSchool);

export default router;
