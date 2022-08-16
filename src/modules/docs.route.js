import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';
import swaggerDefinition from '../docs/swaggerDef.js';

const router = Router();

const specs = swaggerJsdoc({
  swaggerDefinition,
  apis: ['src/docs/*.yml', 'src/routes/v1/*.js'],
});

router.use('/', serve);
router.get(
  '/',
  setup(specs, {
    explorer: true,
  })
);

export default router;
