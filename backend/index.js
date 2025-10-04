import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs/promises';
import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';
import { computeCoverage } from './helpers/computeCoverage.js';
import { checkRules } from './helpers/checkRules.js';
import { computeScores } from './helpers/computeScores.js';
import { readFile } from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const client = new MongoClient(MONGO_URI);

let db;
async function connectDB() {
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB: ${DB_NAME}`);
}

connectDB();

async function loadSchema() {
  const schemaPath = process.env.SCHEMA_FILE || './gets_v0_1_schema.json';
  const fileData = await readFile(schemaPath, 'utf-8'); // read as string
  const schema = JSON.parse(fileData); // parse JSON
  return schema;
}

async function doAnalysis(data, reportId) {
  console.log('Analyzing:', reportId);

  const report = await db
    .collection('reports')
    .findOne({ _id: new ObjectId(reportId) });
  if (!report) throw new Error('Report not found');

  const schema = await loadSchema();

  // Compute coverage
  const coverage = computeCoverage(schema.fields, report.data);

  // Compute rules
  const rulesResultsRaw = checkRules(report.data, coverage);

  // Transform rules into structured findings
  const ruleFindings = [];
  Object.entries(rulesResultsRaw).forEach(([rule, result]) => {
    if (result.ok) {
      ruleFindings.push({ rule, ok: true });
    } else if (result.rows && result.rows.length) {
      result.rows.forEach((err) => {
        const finding = { rule, ok: false };
        if (err.line !== undefined) finding.line = err.line;
        if (err.expected !== undefined) finding.expected = err.expected;
        if (err.got !== undefined) finding.got = err.got;
        if (err.value !== undefined) finding.value = err.value;
        if (err.error !== undefined) finding.value = err.error;
        ruleFindings.push(finding);
      });
    } else {
      ruleFindings.push({ rule, ok: false });
    }
  });

  // Compute scores
  const scores = computeScores(report.data, coverage, ruleFindings, 100);

  // Collect gaps
  const gaps = [];

  // Missing coverage fields
  (coverage.missing || []).forEach((f) => gaps.push(`Missing ${f}`));

  // Failed rules
  ruleFindings.forEach((f) => {
    if (!f.ok) {
      if (
        f.line !== undefined &&
        f.expected !== undefined &&
        f.got !== undefined
      ) {
        gaps.push(
          `Rule ${f.rule} failed at line ${f.line}: expected ${f.expected}, got ${f.got}`
        );
      } else if (f.value !== undefined) {
        gaps.push(`Invalid ${f.rule} value: ${f.value}`);
      } else {
        gaps.push(`Rule ${f.rule} failed`);
      }
    }
  });

  // Meta information
  const meta = {
    rowsParsed: report.data.length || 0,
    linesTotal: report.data.reduce((sum, r) => sum + (r.lines?.length || 1), 0),
    country: report.country || 'unknown',
    erp: report.erp || 'unknown',
    db: 'mongoDB',
  };

  const analysisResult = {
    reportId,
    scores,
    coverage,
    ruleFindings,
    gaps,
    meta,
  };

  // Update report in DB
  await db.collection('reports').updateOne(
    { _id: new ObjectId(reportId) },
    {
      $set: {
        status: 'done',
        finishedAt: new Date(),
        analysis: analysisResult,
      },
    }
  );

  console.log('Analysis finished:', reportId);
  return analysisResult;
}

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let data;

    if (req.body || req.body.data) {
      data = req.body || req.body.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
    }
    // Handle uploaded JSON file
    else if (req.file) {
      if (req.file.mimetype !== 'application/json') {
        return res.status(400).json({ error: 'Only .json files are allowed' });
      }
      const fileContent = await fs.readFile(req.file.path, 'utf-8');
      data = JSON.parse(fileContent);
      await fs.unlink(req.file.path);
    } else {
      return res.status(400).json({ error: 'No data provided' });
    }

    const reportCollection = db.collection('uploads');
    const result = await reportCollection.insertOne({
      data,
      createdAt: new Date(),
    });

    res.json({ uploadId: result.insertedId.toString() });
  } catch (err) {
    console.error('Error in /upload:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/analyze', async (req, res) => {
  try {
    const { uploadId, questionnaire } = req.body;

    if (!uploadId)
      return res.status(400).json({ error: 'No uploadId provided' });

    const upload = await db
      .collection('uploads')
      .findOne({ _id: new ObjectId(uploadId) });
    if (!upload) return res.status(404).json({ error: 'Upload not found' });

    const reportCollection = db.collection('reports');
    const result = await reportCollection.insertOne({
      data: upload.data,
      status: 'pending',
      createdAt: new Date(),
      questionnaire: questionnaire || {},
    });

    res.json({ reportId: result.insertedId.toString() });

    // Trigger async analysis
    doAnalysis(upload.data, result.insertedId.toString(), questionnaire).catch(
      console.error
    );
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze report' });
  }
});

app.get('/report/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const report = await db
      .collection('reports')
      .findOne({ _id: new ObjectId(id) });

    if (!report) return res.status(404).json({ error: 'Report not found' });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching report' });
  }
});

app.get('/reports', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const reports = await db
      .collection('reports')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/health', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ status: 'MongoDB not connected' });
    }

    const collections = await db.listCollections().toArray();
    let totalDocs = 0;

    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      totalDocs += count;
    }

    res.json({
      status: 'ok',
      dbName: DB_NAME,
      collections: collections.length,
      collectionNames: collections.map((col) => col.name),
      totalDocuments: totalDocs,
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.use(express.static('../frontend/dist'));

app.listen(PORT, () => {
  console.log(`--- E Invoice Analyzer By Prethish ---`);
  console.log(`Server running on http://localhost:${PORT}`);
});
