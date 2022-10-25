import authRoute from './auth/auth.route.js';
import docsRoute from './docs.route.js';
import userRoutes from './users/user.route.js';
import schoolRoute from './settings/school.route.js';
import studentRoute from './students/student.route.js';

export default (app) => {
  app.use('/api/v1/docs', docsRoute);
  app.use('/api/v1/auth', authRoute);
  app.use('/api/v1', userRoutes);
  app.use('/api/v1/school', schoolRoute);
  app.use('/api/v1/student', studentRoute);
};
