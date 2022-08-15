import mongoose from 'mongoose';
import Config from '../../src/config/config.js';

const setupTestDB = () => {
  beforeAll(async () => {
    await mongoose.connect(Config.mongoose.url, Config.mongoose.options);
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.collections).map(async (collection) => collection.deleteMany()));
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
};

export default setupTestDB;
