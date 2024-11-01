// This could be a simple controller function example
const getUserInfo = (req, res) => {
    const userId = req.params.id;
    // Business logic for fetching user info could go here
    res.send(`Fetched information for user ${userId}`);
  };
  
  module.exports = { getUserInfo };
  