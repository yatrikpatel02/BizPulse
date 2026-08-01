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

# API Architecture Standards

BizPulse uses Django REST Framework (DRF) as its API layer. All backend APIs must follow the architecture guidelines defined below to ensure consistency, maintainability, and scalability across the project.

## ViewSets for Standard CRUD

Use **ViewSets** for all standard resource-based CRUD APIs. ViewSets reduce boilerplate, keep the codebase consistent, and integrate cleanly with DRF routers.

```python
class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(business__owner=self.request.user)
```

Use **Routers** for automatic URL generation instead of manually defining CRUD routes.

```python
from rest_framework.routers import SimpleRouter

router = SimpleRouter()
router.register(r'products', ProductViewSet, basename='product')
urlpatterns = [path('', include(router.urls))]
```

## Specialized Views for Business Logic

Use more specialized DRF views (`APIView`, `GenericAPIView`, custom actions) only when the endpoint represents business logic, workflows, or behavior that does not naturally fit a standard CRUD resource.

Examples of appropriate specialized views:

* File upload and import workflows (`APIView`)
* Authentication endpoints (`GenericAPIView`, `CreateAPIView`)
* Token refresh with cookie handling (`APIView`)
* Action-based endpoints that perform multi-step operations (`@action` on ViewSets)

## RESTful Conventions

All APIs must follow RESTful conventions:

* **Endpoint naming**: Use plural nouns for resource collections (`/api/products/`, `/api/businesses/`).
* **HTTP methods**: `GET` for reads, `POST` for creation, `PUT`/`PATCH` for updates, `DELETE` for removal.
* **Status codes**: Use standard HTTP status codes (`200`, `201`, `400`, `401`, `403`, `404`, `500`).
* **Response format**: Consistent JSON responses with `detail` for error messages and resource data for success responses.

## Filtering and Pagination

* Use **filtering** as the preferred approach for querying resources instead of creating numerous specialized endpoints.
* Use **pagination** as the default behavior for all endpoints returning collections of data.

## API Documentation

All APIs must be automatically included in the generated OpenAPI/Swagger documentation. Use DRF Spectacular or an equivalent tool to generate schema documentation.

## Design Principles

* APIs should be reusable, maintainable, and scalable.
* Avoid duplicate code and inconsistent patterns across apps.
* Keep views lightweight; put business logic in services.
* Use serializers for validation, deserialization, and response formatting consistently.

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

requirements.txt

backend/

frontend/

docs/

    Context.md
    milestone.md

```


Backend

```
backend/

BizPulse/

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

* Business (Note: A single User can own multiple Businesses)

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
* Use ViewSets for standard resource-based CRUD APIs
* Use Routers for automatic URL generation
* Use APIView, GenericAPIView, or custom actions for business logic and workflow endpoints
* Follow RESTful conventions: plural noun endpoints, standard HTTP methods, consistent status codes and response formats
* Apply filtering as the preferred approach for querying resources
* Apply pagination as the default behavior for collection endpoints
* Standardize serializer usage for validation and response formatting
* Ensure all APIs are included in the generated OpenAPI/Swagger documentation
* Encourage reusable, maintainable, and scalable API design

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
* ViewSets are the default for standard CRUD APIs
* Routers provide automatic URL generation for resource endpoints
* Specialized DRF views (APIView, GenericAPIView) are used for business logic and workflow endpoints
* Filtering is the preferred approach for querying resources
* Pagination is the default behavior for collection endpoints
* All APIs are documented via generated OpenAPI/Swagger documentation

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
