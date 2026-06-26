# BizPulse

> **"Data tells you what happened. BizPulse tells you what to do next."**

A Business Intelligence (BI) and Decision Support Platform that helps businesses identify operational, financial, inventory, customer, and market-related problems through data analytics, machine learning, market intelligence, and automated recommendations.

---

# Overview

BizPulse transforms raw business data into actionable insights.

Instead of simply displaying charts and statistics, the platform focuses on identifying:

* Revenue Problems
* Product Performance Issues
* Inventory Risks
* Customer Satisfaction Problems
* Competitor Threats
* Market Opportunities

The goal is to help businesses make data-driven decisions without requiring advanced analytical expertise.

---

# Project Scope

## Included

### Business Analytics

* Revenue Analysis
* Sales Trend Analysis
* Product Performance Analysis
* Seasonal Trend Analysis

### Customer Intelligence

* Customer Feedback Analysis
* Sentiment Analysis
* Complaint Detection
* Customer Satisfaction Metrics

### Market Intelligence

* Competitor Price Analysis
* Competitor Rating Analysis
* Market Demand Analysis
* Google Trends Analysis

### Inventory Intelligence

* Inventory Health Analysis
* Overstock Detection
* Understock Detection

### Machine Learning

* Sales Forecasting
* Demand Forecasting
* Product Risk Scoring
* Business Health Score
* Outlier Detection

### Reporting

* Executive Reports
* Historical Reports
* PDF Export

---

## Excluded

BizPulse is not:

* ERP Software
* CRM Software
* Inventory Management Software
* Accounting Software
* POS Software

The platform focuses exclusively on analytics and decision support.

---

# Technology Stack

## Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios

## Backend

* Django
* Django REST Framework (DRF)
* JWT Authentication

## Database

* PostgreSQL

## Data Processing

* Pandas
* NumPy

## Machine Learning

* Scikit-Learn

## Data Visualization

* Plotly
* Matplotlib
* Seaborn

## Web Scraping

* BeautifulSoup4
* Requests

## External Integrations

* PyTrends (Google Trends)

## Report Generation

* ReportLab

## Development Tools

* Git
* GitHub
* VS Code
* Postman
* pgAdmin

---

# Data Sources

## User Provided Data

### Required

* Sales Data

### Recommended

* Inventory Data

### Optional

* Customer Reviews

Supported Formats:

* CSV (.csv)
* Excel (.xlsx)
* Legacy Excel (.xls)

---

## Automatically Collected Data

### Google Trends

Collected using PyTrends.

Used for:

* Market Demand Analysis
* Opportunity Detection
* Trend Monitoring

### Competitor Data

Collected through web scraping.

Used for:

* Competitor Pricing Analysis
* Competitor Rating Analysis
* Market Intelligence

---

# Upload Workflow

Upload File

↓

Temporary Processing

↓

Column Mapping

↓

Validation

↓

Cleaning

↓

Database Storage

↓

File Deletion

Uploaded files are not permanently stored.

The database acts as the system's single source of truth.

---

# Column Mapping

The platform supports flexible uploads by allowing user columns to be mapped to standardized system fields.

Example:

| Uploaded Column  | System Field |
| ---------------- | ------------ |
| item_name        | product_name |
| amount           | revenue      |
| qty_sold         | quantity     |
| transaction_date | sale_date    |

---

# Database Schema

## users

Stores platform users.

| Column        | Type                |
| ------------- | ------------------- |
| user_id       | SERIAL PK           |
| name          | VARCHAR(100)        |
| email         | VARCHAR(150) UNIQUE |
| password_hash | VARCHAR(255)        |
| created_at    | TIMESTAMP           |

---

## businesses

Stores business entities managed by users.

| Column        | Type         |
| ------------- | ------------ |
| business_id   | SERIAL PK    |
| user_id       | INT FK       |
| business_name | VARCHAR(255) |
| industry      | VARCHAR(100) |
| created_at    | TIMESTAMP    |

---

## products

| Column       | Type                |
| ------------ | ------------------- |
| product_id   | SERIAL PK           |
| business_id  | INT FK              |
| product_name | VARCHAR(255)        |
| category     | VARCHAR(100)        |
| sku          | VARCHAR(100) UNIQUE |
| created_at   | TIMESTAMP           |

---

## sales_records

| Column     | Type          |
| ---------- | ------------- |
| sale_id    | SERIAL PK     |
| product_id | INT FK        |
| quantity   | INT           |
| unit_price | DECIMAL(10,2) |
| revenue    | DECIMAL(12,2) |
| sale_date  | DATE          |

---

## inventory_snapshots

| Column         | Type      |
| -------------- | --------- |
| snapshot_id    | SERIAL PK |
| product_id     | INT FK    |
| stock_quantity | INT       |
| snapshot_date  | DATE      |

---

## customer_reviews

| Column      | Type         |
| ----------- | ------------ |
| review_id   | SERIAL PK    |
| product_id  | INT FK       |
| rating      | DECIMAL(2,1) |
| review_text | TEXT         |
| review_date | DATE         |

---

## review_sentiment

| Column          | Type         |
| --------------- | ------------ |
| sentiment_id    | SERIAL PK    |
| review_id       | INT FK       |
| sentiment_label | VARCHAR(20)  |
| sentiment_score | DECIMAL(5,2) |

---

## complaint_categories

| Column       | Type         |
| ------------ | ------------ |
| complaint_id | SERIAL PK    |
| review_id    | INT FK       |
| category     | VARCHAR(100) |

---

## competitor_prices

| Column              | Type          |
| ------------------- | ------------- |
| competitor_price_id | SERIAL PK     |
| product_id          | INT FK        |
| competitor_name     | VARCHAR(150)  |
| price               | DECIMAL(10,2) |
| captured_at         | DATE          |

---

## google_trends_data

| Column      | Type         |
| ----------- | ------------ |
| trend_id    | SERIAL PK    |
| keyword     | VARCHAR(255) |
| trend_score | INT          |
| captured_at | DATE         |

---

## insights

| Column      | Type         |
| ----------- | ------------ |
| insight_id  | SERIAL PK    |
| business_id | INT FK       |
| title       | VARCHAR(255) |
| description | TEXT         |
| priority    | VARCHAR(50)  |
| created_at  | TIMESTAMP    |

---

## predictions

| Column           | Type          |
| ---------------- | ------------- |
| prediction_id    | SERIAL PK     |
| product_id       | INT FK        |
| prediction_type  | VARCHAR(100)  |
| predicted_value  | DECIMAL(12,2) |
| confidence_score | DECIMAL(5,2)  |
| prediction_date  | DATE          |

---

## reports

| Column       | Type         |
| ------------ | ------------ |
| report_id    | SERIAL PK    |
| business_id  | INT FK       |
| report_name  | VARCHAR(255) |
| report_type  | VARCHAR(100) |
| generated_at | TIMESTAMP    |

---

## column_mappings

| Column           | Type         |
| ---------------- | ------------ |
| mapping_id       | SERIAL PK    |
| source_column    | VARCHAR(100) |
| mapped_column    | VARCHAR(100) |
| confidence_score | DECIMAL(5,2) |

---

# Core Features

* User Authentication
* Business Management
* CSV/XLS/XLSX Uploads
* Column Mapping
* Data Validation
* Data Cleaning
* Sales Analytics
* Inventory Analytics
* Customer Intelligence
* Competitor Analysis
* Google Trends Analysis
* Market Demand Analysis
* Machine Learning Predictions
* Business Health Scoring
* Automated Insight Generation
* Executive Reports
* PDF Export

---

# Project Status

## Completed

* Project Scope Definition
* Feature Planning
* Technology Stack Selection
* Database Design
* Frontend Structure Planning
* Upload Workflow Design
* Analytics Workflow Design

## In Progress

* Database Implementation
* Backend Development
* Frontend Development

## Upcoming

* Analytics Engine Development
* Machine Learning Integration
* Report Generation Module
* Testing & Optimization

---

# Key Design Decisions

1. BizPulse is a Business Intelligence platform, not an ERP or CRM.
2. Sales data is mandatory.
3. Inventory data is recommended.
4. Customer reviews are optional.
5. Google Trends data is collected automatically.
6. Competitor data is collected automatically.
7. Uploaded files are temporary import sources.
8. Uploaded files are deleted after processing.
9. PostgreSQL is the system's single source of truth.
10. Insights and predictions are stored separately from raw transactional data.
11. Tailwind is the primary frontend styling framework.


---

# Contributing

Contributions, improvements, and suggestions are welcome.

Before making significant changes:

1. Create a new branch.
2. Open an issue describing the proposed change.
3. Submit a pull request with clear documentation.

---

# License

This project is currently developed for academic and educational purposes.

License selection will be finalized before public release.
