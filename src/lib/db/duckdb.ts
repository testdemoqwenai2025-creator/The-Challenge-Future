// NEXUS Analytics Database - DuckDB Integration
// High-performance analytical database for dashboard metrics, trends, and predictions
// 
// Why DuckDB?
// - In-process OLAP database (no server needed)
// - Columnar storage (fast aggregations)
// - SQL compliant (familiar query language)
// - Excellent for time-series and analytical workloads
// - Can handle millions of rows efficiently

export interface DuckDBConfig {
  databasePath?: string; // ':memory:' for in-memory, or file path
  enableWAL?: boolean;   // Write-Ahead Logging
  maxMemory?: string;    // e.g., '4GB'
}

export interface QueryResult<T = any> {
  success: boolean;
  data: T[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsMetrics {
  // Opportunity metrics
  totalOpportunities: number;
  newOpportunitiesThisWeek: number;
  opportunitiesBySector: Array<{ sector: string; count: number }>;
  opportunitiesByRegion: Array<{ region: string; count: number }>;
  
  // Funding metrics
  totalFundingPool: number;
  averageAwardSize: number;
  fundingBySource: Array<{ source: string; amount: number }>;
  successRate: number;
  
  // User engagement
  activeUsers: number;
  applicationsInProgress: number;
  autoFillUsage: number;
  
  // Trends
  opportunityTrend: TimeSeriesPoint[];
  applicationTrend: TimeSeriesPoint[];
  successRateTrend: TimeSeriesPoint[];
}

class NexusDuckDB {
  private db: any = null; // DuckDB instance
  private config: DuckDBConfig;
  private initialized: boolean = false;

  constructor(config?: DuckDBConfig) {
    this.config = {
      databasePath: config?.databasePath || ':memory:',
      enableWAL: config?.enableWAL ?? true,
      maxMemory: config?.maxMemory || '2GB',
    };
  }

  /**
   * Initialize DuckDB database with schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamic import for DuckDB (browser/node compatible)
      const duckdbModule = await import('@duckdb/duckdb-wasm');
      const duckdb = duckdbModule.default;

      const logger = new duckdb.ConsoleLogger();
      const worker = await duckdb.createWorker(
        duckdb.selectBundle({
          mvp: { mainModule: '/duckdb-mvp.wasm', mainWorker: '/duckdb-mvp-browser.mjs' },
          eh: { mainModule: '/duckdb-eh.wasm', mainWorker: '/duckdb-eh-browser.mjs' },
        })
      );

      this.db = new duckdb.AsyncDuckDB(logger, worker);
      await this.db.instantiate(this.config.maxMemory);

      // Create schema
      await this.createSchema();
      
      this.initialized = true;
      console.log('✅ DuckDB initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize DuckDB:', error);
      throw error;
    }
  }

  /**
   * Create all necessary tables for NEXUS analytics
   */
  private async createSchema(): Promise<void> {
    const schemaSQL = `
      -- Opportunities table (grants, tenders, etc.)
      CREATE TABLE IF NOT EXISTS opportunities (
        id VARCHAR PRIMARY KEY,
        source VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        description TEXT,
        notice_type VARCHAR,
        sector VARCHAR,
        subsector VARCHAR,
        region VARCHAR,
        country VARCHAR DEFAULT 'UK',
        currency VARCHAR DEFAULT 'GBP',
        min_amount DOUBLE,
        max_amount DOUBLE,
        status VARCHAR DEFAULT 'open',
        deadline DATE,
        published_at TIMESTAMP,
        url VARCHAR,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Companies table (from Companies House)
      CREATE TABLE IF NOT EXISTS companies (
        company_number VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        legal_structure VARCHAR,
        incorporation_date DATE,
        registered_address TEXT,
        sector VARCHAR,
        sic_codes JSON,
        employee_count INTEGER,
        annual_revenue DOUBLE,
        status VARCHAR DEFAULT 'active',
        companies_house_data JSON,
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Applications table (user submissions)
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR,
        opportunity_id VARCHAR,
        grant_programme_id VARCHAR,
        status VARCHAR DEFAULT 'discovered',
        auto_fill_progress INTEGER DEFAULT 0,
        fields_completed INTEGER DEFAULT 0,
        fields_total INTEGER DEFAULT 0,
        submitted_at TIMESTAMP,
        decision_date TIMESTAMP,
        outcome_amount DOUBLE,
        data JSON,
        review_notes TEXT,
        submitted_via VARCHAR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
      );

      -- Gazette notices table
      CREATE TABLE IF NOT EXISTS gazette_notices (
        id VARCHAR PRIMARY KEY,
        source VARCHAR NOT NULL,
        notice_type VARCHAR,
        title VARCHAR NOT NULL,
        content TEXT,
        summary VARCHAR,
        published_at TIMESTAMP,
        url VARCHAR,
        metadata JSON,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Users table (analytics only)
      CREATE TABLE IF NOT EXISTS user_analytics (
        user_id VARCHAR PRIMARY KEY,
        email VARCHAR,
        plan VARCHAR DEFAULT 'explorer',
        role VARCHAR DEFAULT 'founder',
        organization VARCHAR,
        signup_date TIMESTAMP,
        last_active TIMESTAMP,
        applications_count INTEGER DEFAULT 0,
        searches_count INTEGER DEFAULT 0,
        watchlist_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Events table (for tracking user actions)
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR PRIMARY KEY,
        event_type VARCHAR NOT NULL,
        user_id VARCHAR,
        entity_type VARCHAR,
        entity_id VARCHAR,
        properties JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for common queries
      CREATE INDEX IF NOT EXISTS idx_opportunities_sector ON opportunities(sector);
      CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
      CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);
      CREATE INDEX IF NOT EXISTS idx_opportunities_published ON opportunities(published_at);
      CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
      CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
      CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_gazette_type ON gazette_notices(notice_type);
      CREATE INDEX IF NOT EXISTS idx_gazette_published ON gazette_notices(published_at);
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    `;

    await this.executeSQL(schemaSQL);
    
    console.log('📊 DuckDB schema created successfully');
  }

  /**
   * Execute a SQL query and return results
   */
  async executeSQL<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      const connection = await this.db.connect();
      let result;

      if (params && params.length > 0) {
        result = await connection.query(sql, ...params);
      } else {
        result = await connection.query(sql);
      }

      const executionTime = Date.now() - startTime;

      // Convert DuckDB result to array format
      const data = result.toArray().map((row: any) => {
        const obj: Record<string, any> = {};
        for (const col of result.schema.columns) {
          obj[col.name] = row[col.name];
        }
        return obj as T;
      });

      return {
        success: true,
        data,
        rowCount: data.length,
        executionTimeMs: executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('SQL Execution Error:', error);
      
      return {
        success: false,
        data: [],
        rowCount: 0,
        executionTimeMs: executionTime,
        error: error instanceof Error ? error.message : 'Unknown SQL error'
      };
    }
  }

  /**
   * Insert gazette notices into database
   */
  async insertGazetteNotices(notices: Array<{
    id: string;
    source: string;
    noticeType: string;
    title: string;
    content?: string;
    summary?: string;
    publishedAt: Date;
    url: string;
    metadata?: any;
  }>): Promise<QueryResult> {
    const values = notices.map(n => [
      n.id,
      n.source,
      n.noticeType,
      n.title,
      n.content || null,
      n.summary || null,
      n.publishedAt.toISOString(),
      n.url,
      n.metadata ? JSON.stringify(n.metadata) : null
    ]);

    const sql = `
      INSERT OR REPLACE INTO gazette_notices 
        (id, source, notice_type, title, content, summary, published_at, url, metadata)
      VALUES ${values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
    `;

    const flatValues = values.flat();
    return this.executeSQL(sql, flatValues);
  }

  /**
   * Insert companies from Companies House API
   */
  async insertCompanies(companies: Array<{
    companyNumber: string;
    name: string;
    legalStructure?: string;
    incorporationDate?: string;
    registeredAddress?: string;
    sector?: string;
    sicCodes?: string[];
    status?: string;
    rawData?: any;
  }>): Promise<QueryResult> {
    const values = companies.map(c => [
      c.companyNumber,
      c.name,
      c.legalStructure || null,
      c.incorporationDate || null,
      c.registeredAddress || null,
      c.sector || null,
      c.sicCodes ? JSON.stringify(c.sicCodes) : null,
      c.status || 'active',
      c.rawData ? JSON.stringify(c.rawData) : null
    ]);

    const sql = `
      INSERT OR REPLACE INTO companies 
        (company_number, name, legal_structure, incorporation_date, registered_address, 
         sector, sic_codes, status, companies_house_data)
      VALUES ${values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
    `;

    const flatValues = values.flat();
    return this.executeSQL(sql, flatValues);
  }

  /**
   * Get aggregated analytics metrics for dashboard
   */
  async getAnalyticsMetrics(dateRange: { start: Date; end: Date }): Promise<AnalyticsMetrics> {
    const startDate = dateRange.start.toISOString();
    const endDate = dateRange.end.toISOString();

    // Run multiple queries in parallel
    const [
      oppResult,
      newOppsResult,
      sectorResult,
      regionResult,
      fundingResult,
      avgAwardResult,
      sourceResult,
      successResult,
      trendResult
    ] = await Promise.all([
      // Total opportunities
      this.executeSQL(`SELECT COUNT(*) as count FROM opportunities WHERE status = 'open'`),
      
      // New opportunities this week
      this.executeSQL(`
        SELECT COUNT(*) as count 
        FROM opportunities 
        WHERE published_at >= '${startDate}' AND published_at <= '${endDate}'
      `),
      
      // By sector
      this.executeSQL(`
        SELECT sector, COUNT(*) as count 
        FROM opportunities 
        WHERE status = 'open'
        GROUP BY sector 
        ORDER BY count DESC 
        LIMIT 10
      `),
      
      // By region
      this.executeSQL(`
        SELECT region, COUNT(*) as count 
        FROM opportunities 
        WHERE status = 'open'
        GROUP BY region 
        ORDER BY count DESC 
        LIMIT 10
      `),
      
      // Total funding pool
      this.executeSQL(`
        SELECT COALESCE(SUM(max_amount), 0) as total 
        FROM opportunities 
        WHERE status = 'open'
      `),
      
      // Average award size
      this.executeSQL(`
        SELECT COALESCE(AVG(outcome_amount), 0) as average 
        FROM applications 
        WHERE status = 'awarded'
      `),
      
      // By funding source
      this.executeSQL(`
        SELECT source, SUM(max_amount) as amount 
        FROM opportunities 
        WHERE status = 'open'
        GROUP BY source 
        ORDER BY amount DESC 
        LIMIT 5
      `),
      
      // Success rate
      this.executeSQL(`
        SELECT 
          CASE 
            WHEN COUNT(*) > 0 THEN ROUND(100.0 * SUM(CASE WHEN status = 'awarded' THEN 1 ELSE 0 END) / COUNT(*), 1)
            ELSE 0 
          END as rate
        FROM applications
      `),
      
      // Opportunity trend (last 30 days)
      this.executeSQL(`
        SELECT 
          DATE(published_at) as date,
          COUNT(*) as value
        FROM opportunities 
        WHERE published_at >= DATE('now', '-30 days')
        GROUP BY DATE(published_at)
        ORDER BY date ASC
      `)
    ]);

    return {
      totalOpportunities: oppResult.data[0]?.count || 0,
      newOpportunitiesThisWeek: newOppsResult.data[0]?.count || 0,
      opportunitiesBySector: sectorResult.data.map(r => ({ sector: r.sector, count: r.count })),
      opportunitiesByRegion: regionResult.data.map(r => ({ region: r.region, count: r.count })),
      totalFundingPool: fundingResult.data[0]?.total || 0,
      averageAwardSize: avgAwardResult.data[0]?.average || 0,
      fundingBySource: sourceResult.data.map(r => ({ source: r.source, amount: r.amount })),
      successRate: successResult.data[0]?.rate || 0,
      opportunityTrend: trendResult.data.map(r => ({
        date: r.date,
        value: r.value
      })),
      activeUsers: 0, // Would come from user_analytics table
      applicationsInProgress: 0,
      autoFillUsage: 0,
      applicationTrend: [],
      successRateTrend: []
    };
  }

  /**
   * Get capital heatmap data (for dashboard widget)
   */
  async getCapitalHeatmap(): Promise<Array<{
    sector: string;
    region: string;
    amount: number;
    count: number;
  }>> {
    const result = await this.executeSQL(`
      SELECT 
        COALESCE(o.sector, 'Other') as sector,
        COALESCE(o.region, 'UK') as region,
        COALESCE(SUM(o.max_amount), 0) as amount,
        COUNT(*) as count
      FROM opportunities o
      WHERE o.status = 'open'
      GROUP BY o.sector, o.region
      HAVING COUNT(*) > 0
      ORDER BY amount DESC
      LIMIT 50
    `);

    return result.data;
  }

  /**
   * Get predictive timeline data
   */
  async getPredictiveTimeline(): Promise<Array<{
    date: string;
    deadlineCount: number;
    estimatedAwards: number;
  }>> {
    const result = await this.executeSQL(`
      SELECT 
        DATE(deadline) as date,
        COUNT(*) as deadline_count,
        CAST(COUNT(*) * 0.15 AS INTEGER) as estimated_awards -- ~15% success assumption
      FROM opportunities 
      WHERE deadline >= DATE('now') AND deadline <= DATE('now', '+90 days')
      GROUP BY DATE(deadline)
      ORDER BY date ASC
      LIMIT 90
    `);

    return result.data.map(r => ({
      date: r.date,
      deadlineCount: r.deadline_count,
      estimatedAwards: r.estimated_awards
    }));
  }

  /**
   * Export data to CSV or JSON
   */
  async exportData(table: string, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const result = await this.executeSQL(`SELECT * FROM ${table} LIMIT 10000`);
    
    if (format === 'json') {
      return JSON.stringify(result.data, null, 2);
    }
    
    // CSV format
    if (result.data.length > 0) {
      const headers = Object.keys(result.data[0]);
      const csvRows = [
        headers.join(','),
        ...result.data.map(row => 
          headers.map(h => {
            const val = row[h];
            return typeof val === 'string' && val.includes(',') 
              ? `"${val}"` 
              : val ?? '';
          }).join(',')
        )
      ];
      return csvRows.join('\n');
    }
    
    return '';
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.terminate();
      this.initialized = false;
      console.log('🔒 DuckDB connection closed');
    }
  }
}

// Singleton instance
let dbInstance: NexusDuckDB | null = null;

export async function getDuckDB(config?: DuckDBConfig): Promise<NexusDuckDB> {
  if (!dbInstance) {
    dbInstance = new NexusDuckDB(config);
    await dbInstance.initialize();
  }
  return dbInstance;
}

// Export class for testing or custom instances
export { NexusDuckDB };

// Mock data for development when DuckDB is not available
export const mockAnalyticsMetrics: AnalyticsMetrics = {
  totalOpportunities: 1247,
  newOpportunitiesThisWeek: 89,
  opportunitiesBySector: [
    { sector: 'AI & Machine Learning', count: 234 },
    { sector: 'Clean Energy', count: 189 },
    { sector: 'Quantum Computing', count: 156 },
    { sector: 'Biotech & Pharma', count: 145 },
    { sector: 'Semiconductors', count: 123 },
    { sector: 'Space Technology', count: 98 },
    { sector: 'Advanced Materials', count: 87 },
    { sector: 'Robotics', count: 65 },
    { sector: 'Cybersecurity', count: 54 },
    { sector: 'Other Deep Tech', count: 96 }
  ],
  opportunitiesByRegion: [
    { region: 'London', count: 342 },
    { region: 'South East', count: 234 },
    { region: 'East of England', count: 189 },
    { region: 'North West', count: 156 },
    { region: 'Scotland', count: 134 },
    { region: 'West Midlands', count: 98 },
    { region: 'Yorkshire', count: 67 },
    { region: 'Northern Ireland', count: 45 },
    { region: 'Wales', count: 38 },
    { region: 'International (EU)', count: 289 }
  ],
  totalFundingPool: 2875000000, // £2.875B
  averageAwardSize: 245000,
  fundingBySource: [
    { source: 'Innovate UK', amount: 850000000 },
    { source: 'Horizon Europe', amount: 650000000 },
    { source: 'EIC Accelerator', amount: 450000000 },
    { source: 'National Institutes', amount: 380000000 },
    { source: 'Regional Funds', amount: 295000000 }
  ],
  successRate: 23.5,
  activeUsers: 1247,
  applicationsInProgress: 456,
  autoFillUsage: 1823,
  opportunityTrend: generateMockTrend(30, 20, 40),
  applicationTrend: generateMockTrend(30, 5, 15),
  successRateTrend: generateMockTrend(30, 18, 28)
};

function generateMockTrend(days: number, min: number, max: number): TimeSeriesPoint[] {
  const trend: TimeSeriesPoint[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    trend.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * (max - min + 1)) + min
    });
  }
  
  return trend;
}
