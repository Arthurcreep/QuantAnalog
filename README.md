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