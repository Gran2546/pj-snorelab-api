const express = require('express');
const cors = require('cors'); // Import CORS package
const app = express();
const port = 3007;

// Import routes
const userRoutes = require('./router/users');
const historyRoutes = require('./router/histories');
const recordRoutes = require('./router/records');
const adminRoutes = require('./router/admins');
const roleRoutes = require('./router/roles');

// Import database and other configs
const { connectDB } = require('./config/db');

// Connect to the database
connectDB();

// Middleware (optional: for parsing JSON or static files)
app.use(cors({
    origin: '*', // Allow requests only from this origin
}));
app.use(express.json());

// Use the routes
app.use('/user', userRoutes);
app.use('/history', historyRoutes);
app.use('/record', recordRoutes);
app.use('/admin', adminRoutes);
app.use('/role', roleRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
