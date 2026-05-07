const Class = require('../models/Class');

const getClasses = async (req, res) => {
  try {
    const classes = await Class.findAll({
      order: [['name', 'ASC']]
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClasses };