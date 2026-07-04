import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Save a new assessment
app.post('/api/assessments', async (req, res) => {
  try {
    const { roofArea, latitude, longitude, totalRainfallMM, litersHarvested, hasGarden, wantsDrinking } = req.body;

    const assessment = await prisma.assessment.create({
      data: {
        roofArea,
        latitude,
        longitude,
        totalRainfallMM,
        litersHarvested,
        hasGarden,
        wantsDrinking,
      },
    });

    res.status(201).json(assessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

// Get all past assessments
app.get('/api/assessments', async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(assessments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});