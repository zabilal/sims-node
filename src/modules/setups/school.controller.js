import httpStatus from 'http-status';
import schoolService from './school.service.js';
import catchAsync from '../../utils/catchAsync.js';

const createSchool = catchAsync(async (req, res) => {
  const school = await schoolService.createSchool(req.body);
  res.status(httpStatus.CREATED).send(school);
});

export default {
  createSchool,
};
