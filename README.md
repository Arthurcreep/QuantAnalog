# QuantLog

QuantLog — модульная платформа для количественного исследования финансовых рынков.

Цель проекта — построить воспроизводимый pipeline:

```text
RAW Data
    ↓
Validation
    ↓
Cleaning / Repair
    ↓
Stitching
    ↓
Versioning
    ↓
Prepared Dataset
    ↓
Research / Forecasting / Cross-Asset / Arbitrage
    ↓
Validation
    ↓
Economics
    ↓
Evidence
    ↓
Reports / Real-Time Monitoring
```

## Основная идея

QuantLog не является системой, которая просто пытается «угадать цену».

Каждый результат должен быть воспроизводим:

- от исходного RAW-файла;
- через validation и transformations;
- до research result, forecast или alert.

RAW-данные не изменяются.

Любая очистка, восстановление, агрегация или другая трансформация создаёт новый dataset artifact с lineage.

## Research integrity fixes (September 2026)

- `npm test` runs the database-independent regression suite (HTTP/repository boundaries are mocked where needed).
- Categorical and continuous evidence require the complete horizon set from the saved `AnalysisRun.config.protocol`; missing or duplicate results fail evaluation.
- Strict majority means `floor(n / 2) + 1`. Categorical OOS requires the frozen high-minus-low contrast to retain a positive sign; level 5 additionally requires a finite positive bootstrap interval.
- Evidence policy is now `1.2.0`, evidence engine `evidence-v1.3`. Existing report snapshots remain unchanged; generating a new snapshot uses the new version. Old runs lacking their saved horizon protocol cannot be upgraded silently.
- Return and volatility diagnostics require a contiguous series. They fail with `NON_CONTIGUOUS_DIAGNOSTIC_SERIES` before writing results when a gap is found. Use an explicitly prepared contiguous interval; do not fill unknown prices just to pass this check.
- Rolling realized volatility now requires `expectedIntervalMs` and only emits complete windows within contiguous segments.
- The home page lists the latest 50 persisted forecast runs through `GET /api/v1/forecasts`, with separate empty and error states; no local run UUIDs are embedded.

Verification:

```bash
npm test
node scripts/test-research-planner.js
node scripts/test-continuous-evidence.js
npm --prefix frontend run build
npm --prefix frontend run lint
```

These checks do not replace an end-to-end run against your PostgreSQL database and historical datasets. Recompute affected diagnostics and generate new report snapshots before relying on revised evidence levels.

## Current Status

Текущий этап разработки:

**Stage 1 — Data Core**

Уже реализовано:

- Express application foundation;
- environment configuration;
- PostgreSQL + Sequelize;
- Sequelize migrations;
- global error handling;
- `/health` с проверкой PostgreSQL;
- `datasets` table;
- Dataset model;
- Dataset repository;
- Dataset metadata validation;
- immutable RAW storage;
- SHA-256 checksum;
- RAW dataset import service;
- OHLCV CSV schema validation;
- candle timestamp validation.

## Tech Stack

### Backend

- JavaScript
- Node.js
- Express
- CommonJS
- PostgreSQL
- Sequelize

### Data Storage

- PostgreSQL — metadata, configuration, lineage и results;
- Parquet / filesystem — большие immutable time-series datasets.

### Frontend

Планируется:

- React
- Recharts
- lightweight-charts

Quantitative calculations на frontend запрещены.

## Architecture

Backend разделяется по ответственности:

```text
route
  ↓
controller
  ↓
service
  ↓
engine
  ↓
calculation / repository / provider
```

Основные правила проекта:

- функции пишутся через arrow functions;
- routes не содержат business logic;
- controllers не содержат quant calculations;
- services управляют use cases;
- repositories работают с persistence;
- calculations должны быть небольшими и переиспользуемыми;
- frontend только отображает готовые backend results.

## Data Pipeline

```text
RAW SOURCE
    ↓
INGESTION
    ↓
SCHEMA VALIDATION
    ↓
TIMESTAMP VALIDATION
    ↓
DUPLICATE / OVERLAP / GAP ANALYSIS
    ↓
DOMAIN VALIDATION
    ↓
CLEANING / REPAIR
    ↓
DATASET STITCHING
    ↓
CANONICAL DATASET
    ↓
TIMEFRAME BUILDER
    ↓
PREPARED DATASET
    ↓
RESEARCH / FORECAST / CROSS-ASSET / ARBITRAGE
```

## Dataset Principles

Observation statuses:

```text
VALID
SUSPICIOUS
INVALID
GAP
```

Dataset quality statuses:

```text
PASS
ACCEPTABLE_WITH_WARNINGS
BLOCKED
```

RAW datasets are immutable.

Unknown values must not be silently reconstructed when doing so would introduce new information.

## Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Health check:

```text
GET /health
```

Run migrations:

```bash
npm run db:migrate
```

Check migration status:

```bash
npm run db:migrate:status
```

## Current Tests

```bash
npm run test:dataset-repository
npm run test:dataset-service
npm run test:raw-storage
npm run test:import-raw
npm run test:candle-schema
npm run test:candle-timestamps
```

These temporary test scripts will later be migrated to a structured automated test suite.

## Roadmap

```text
Foundation
    ↓
Data Core
    ↓
Data Preparation
    ↓
First BTCUSDT / Bybit Vertical Slice
    ↓
Forecasting
    ↓
Frontend
    ↓
Reports / PDF
    ↓
Cross-Asset
    ↓
Arbitrage
    ↓
Real-Time
    ↓
Alerts
    ↓
Advanced Data Sources and Models
```

## Project Status

Early development.

Current focus: reliable and reproducible market data foundation before Research and Forecasting layers are introduced.