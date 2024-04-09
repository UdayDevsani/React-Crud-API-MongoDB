const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb+srv://udaydevsani24:Nh07EHvu6iK0x5pZ@cluster0.gtpw4xs.mongodb.net/crud', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

const userSchema = new mongoose.Schema({
  name: String,
  dob: Date,
  email: {
    type: String,
    unique: true
  },
  password: String
});

const User = mongoose.model('User', userSchema);

const companySchema = new mongoose.Schema({
  name: String,
  companyName: String,
  position: String,
  age: Number,
  startDate: Date
});

const Company = mongoose.model('Company', companySchema);

app.post('/register', async (req, res) => {
  const { name, dob, email, password } = req.body;

  if (!name || !dob || !email || !password) {
    return res.status(400).json({ error: 'Please fill in all fields' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, dob, email, password: hash });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const secretKey = '8ed15b4361efcad7705435b9d39cd82ff75a135a0d698e895114e855e2ea9ecf';
    const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/companies', async (req, res) => {
  try {
    const companies = await Company.find();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching companies' });
  }
});

app.post('/api/companies/add', async (req, res) => {
  const { name, companyName, position, age, startDate } = req.body;

  if (!name || !companyName || !position || !age || !startDate) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  try {
    const newCompany = new Company({ name, companyName, position, age, startDate });
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add company' });
  }
});

app.get('/api/companies/:id', async (req, res) => {
  const companyId = req.params.id;

  try {
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching company data' });
  }
});

app.put('/api/companies/edit/:id', async (req, res) => {
  const companyId = req.params.id;
  const { name, companyName, position, age, startDate } = req.body;

  if (!name || !companyName || !position || !age || !startDate) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  try {
    const updatedCompany = await Company.findByIdAndUpdate(companyId, {
      name,
      companyName,
      position,
      age,
      startDate
    }, { new: true });

    if (!updatedCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.status(200).json(updatedCompany);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update company' });
  }
});

app.delete('/api/companies/delete/:id', async (req, res) => {
  const companyId = req.params.id;

  try {
    const deletedCompany = await Company.findByIdAndDelete(companyId);
    if (!deletedCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting company' });
  }
});

app.get('/logout', (req, res) => {
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
