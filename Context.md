# CONTEXT.md

# BizPulse Development Context

This document contains the implementation context, architecture decisions, development conventions, UI structure, and workflows for the BizPulse project.

This document should always be considered before implementing new features.

---

# Project Overview

BizPulse is a Business Intelligence (BI) and Decision Support Platform.

The objective is to help businesses make better decisions through analytics instead of managing daily business operations.

The platform is NOT:

* ERP
* CRM
* Accounting Software
* Inventory Management System
* POS

Instead, BizPulse focuses on:

* Analytics
* Insights
* Forecasting
* Recommendations
* Reporting

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
* Django REST Framework
* JWT Authentication

## Database

* PostgreSQL

## Data Processing

* Pandas
* NumPy

## Machine Learning

* Scikit-Learn

## Visualization

* Plotly
* Matplotlib
* Seaborn

## Web Scraping

* BeautifulSoup4
* Requests

## External APIs

* Google Trends (PyTrends)

## Reports

* ReportLab

---

# Development Philosophy

The project follows a **Backend First** architecture.

Development order:

1. Database
2. Django Models
3. REST APIs
4. Testing
5. Frontend Integration
6. Analytics
7. Machine Learning
8. Reports

Frontend should never contain business logic.

Business logic belongs in the backend.

---

# Folder Structure

```
bizpulse/

README.md
CONTEXT.md

backend/

frontend/
```

Backend

```
backend/

config/

apps/

accounts/

businesses/

products/

analytics/

integrations/

reports/

media/

static/

logs/

scripts/

requirements.txt

.env

.env.example

manage.py
```

Every application follows the same architecture.

```
app/

admin.py

apps.py

urls.py

permissions.py

signals.py

models/

serializers/

services/

validators/

views/

tests/

migrations/
```

Avoid large files.

Split functionality into packages whenever possible.

---

# Database Ownership

accounts

* User

businesses

* Business

products

* Product

analytics

* SalesRecord
* InventorySnapshot
* CustomerReview
* ReviewSentiment
* ComplaintCategory
* Prediction
* Insight

integrations

* GoogleTrendsData
* CompetitorPrice
* ColumnMapping
* ImportBatch

reports

* Report

---

# Data Sources

## User Uploads

Required

* Sales

Recommended

* Inventory

Optional

* Customer Reviews

Supported Formats

* CSV
* XLSX
* XLS

---

## Automatically Collected

Google Trends

Competitor Prices

Competitor Ratings

Users never upload these datasets.

---

# Upload Workflow

Upload File

↓

Temporary Storage

↓

Column Detection

↓

Column Mapping

↓

Validation

↓

Cleaning

↓

Database Insert

↓

Delete Temporary File

Uploaded datasets are NOT permanently stored.

PostgreSQL is the single source of truth.

---

# Column Mapping

Different businesses use different column names.

Example

```
item_name

↓

product_name
```

```
amount

↓

revenue
```

```
qty_sold

↓

quantity
```

Column mapping happens before validation.

Mappings are stored for future imports.

Column Mapping Technical Notes

* ColumnMapping.source_type distinguishes the three dataset types: sales, inventory, reviews
* Each business has its own set of mappings (business-scoped, not global)
* The expected source columns per dataset type are:
    sales: date, product/product_name, quantity/qty, revenue/amount, cost
    inventory: date, product/product_name, quantity_on_hand, reorder_point
    reviews: date, product/product_name (optional), rating, text/review, author_name
* Suggested mappings use a confidence score (float 0-1) based on fuzzy matching
* When a mapping does not exist, show manual dropdown for user to select target column
* Once mapped and confirmed by user, save the mapping for future imports of the same business and dataset_type

---

# UI Philosophy

The interface should feel like a modern SaaS dashboard.

Avoid clutter.

Prefer tabs over excessive sidebar navigation.

---

# Sidebar

```
📊 Dashboard

📂 Data

📈 Analytics

💡 Insights

📄 Reports

⚙ Settings

👤 Profile
```

The sidebar should remain minimal.

Most navigation happens inside pages using tabs.

---

# Dashboard

Purpose

Executive Overview for a quick business health check.

Contains

* Key Business Metrics (KPI Cards)
* Important Alerts (Inventory, Revenue anomalies)
* Recent Activity (Recent  csv uploads, Quick Actions)

Detailed charts, filtering, drill-downs, and advanced analysis are handled by the Analytics page.

Dashboard answers

"What's the current state of my business?"

---

# Data Page

Tabs

```
Upload & Mapping

Preview
```

Upload & Mapping

Contains

* Upload Sales
* Upload Inventory
* Upload Reviews

Automatic column detection.

Manual column mapping.

Validation.

Import.

Preview

Contains

* Cleaned data preview
* Duplicate summary
* Missing value summary
* Outlier summary
* Import confirmation

---

# Analytics

Tabs

```
Sales

Inventory

Customers

Market

Predictions
```

Sales

* Revenue
* Sales Trends
* Product Performance
* Seasonal Analysis

Inventory

* Inventory Health
* Overstock
* Understock
* Inventory History

Customers

* Review Analysis
* Sentiment Analysis
* Complaint Categories

If reviews are unavailable:

Display a friendly empty state asking users to upload a review dataset.

Market

* Google Trends
* Competitor Prices
* Competitor Ratings
* Market Demand

Predictions

* Sales Forecast
* Product Risk
* Business Health Score
* Demand Forecast

Analytics answers

"Why is this happening?"

---

# Insights

Purpose

Automatically generated business recommendations.

No complex charts.

Display insight cards.

Each card includes

* Problem
* Reason
* Recommendation

Examples

Revenue Declining

Competitor Price Lower

Growing Market Demand

Inventory Risk

Insights answer

"What should I do?"

---

# Reports

Tabs

```
Generate

History
```

Generate

* Executive Report
* Sales Report
* Inventory Report
* Customer Report
* Market Report

History

Previously generated reports.

Reports are exported as PDF.

Only report metadata is stored in PostgreSQL.

---

# Settings

Tabs

```
Business

Account

Preferences
```

Business

* Business Name
* Industry

Account

* Name
* Email
* Password

Preferences

* Theme
* Notifications
* Report Preferences

---

# Coding Standards

* Follow PEP8
* Keep functions small
* Prefer composition over duplication
* Use meaningful variable names
* Use type hints where applicable
* Keep business logic inside services
* Views should remain lightweight
* Models should represent data only

---

# Design Decisions

* Backend First Development
* PostgreSQL is the only source of truth
* Uploaded files are temporary
* Reports store metadata only
* Google Trends data is automatically collected
* Competitor data is automatically collected
* Customer Reviews are optional
* Inventory is recommended
* Sales data is mandatory
* Tailwind CSS is the frontend framework
* Feature-based application architecture
* Package-based app organization

---

# Future Scope

These are intentionally excluded from the current implementation.

* Manual business data entry
* Scheduled automatic imports
* Multiple user roles
* Email reports
* Live ERP integrations
* Shopify integration
* WooCommerce integration
* Cloud deployment
* Organization collaboration
