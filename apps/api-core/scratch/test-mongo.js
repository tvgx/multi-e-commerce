const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

const uri = process.env.MONGO_DB_ATLAS;
console.log('Testing connection to:', uri.replace(/:([^@]+)@/, ':****@'));

mongoose.connect(uri)
  .then(() => {
    console.log('Connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
