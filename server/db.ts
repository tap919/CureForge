import Database from 'better-sqlite3';

const db = new Database('cureforge.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS targets (
    id TEXT PRIMARY KEY,
    symbol TEXT,
    area TEXT,
    disease TEXT,
    score REAL,
    safety TEXT,
    tractability TEXT,
    infoGain REAL
  );

  CREATE TABLE IF NOT EXISTS audit_records (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS daemon_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    type TEXT,
    message TEXT
  );
`);

export async function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) as c FROM targets').get() as { c: number };
  if (count.c === 0) {
    try {
      const query = `
        query {
          disease(efoId: "EFO_0000616") {
            associatedTargets(page: {index: 0, size: 5}) {
              rows {
                target {
                  id
                  approvedSymbol
                }
                score
              }
            }
          }
        }
      `;
      const res = await fetch('https://api.platform.opentargets.org/api/v4/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      const insert = db.prepare('INSERT INTO targets (id, symbol, area, disease, score, safety, tractability, infoGain) VALUES (@id, @symbol, @area, @disease, @score, @safety, @tractability, @infoGain)');

      if (data?.data?.disease?.associatedTargets?.rows) {
        for (const row of data.data.disease.associatedTargets.rows) {
          const t = {
             id: row.target.id,
             symbol: row.target.approvedSymbol,
             area: 'Oncology',
             disease: 'Neoplasm',
             score: row.score || 0.5,
             safety: 'Medium',
             tractability: 'High',
             infoGain: 0.8
          };
          insert.run(t);
        }
        return;
      }
    } catch (err) {
      console.error('Failed to seed from OpenTargets, using fallback:', err);
    }
    
    // Fallback logic
    const targets = [
      { id: 'ENSG00000130203', symbol: 'APOE', area: 'Neurodegeneration', disease: "Alzheimer's Disease", score: 0.96, safety: 'Medium', tractability: 'Low', infoGain: 0.95 },
      { id: 'ENSG00000157764', symbol: 'BRAF', area: 'Oncology', disease: 'Melanoma', score: 0.95, safety: 'Low', tractability: 'High', infoGain: 0.8 },
      { id: 'ENSG00000146648', symbol: 'EGFR', area: 'Oncology', disease: 'Lung Cancer', score: 0.92, safety: 'Medium', tractability: 'High', infoGain: 0.75 },
      { id: 'ENSG00000232810', symbol: 'TNF', area: 'Immunology', disease: 'Rheumatoid Arthritis', score: 0.89, safety: 'Low', tractability: 'High', infoGain: 0.6 },
    ];
    const insertFallback = db.prepare('INSERT INTO targets (id, symbol, area, disease, score, safety, tractability, infoGain) VALUES (@id, @symbol, @area, @disease, @score, @safety, @tractability, @infoGain)');
    for (const t of targets) { insertFallback.run(t); }
  }
}

export default db;
