# RentAtlas — Rental Comparable Analysis Tool

Standalone rental comp search app built on the CompAtlas architecture. Search, filter, adjust, and export rental comparable analyses for rent surveys, fair rental value determinations, and market rent opinions.

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment config
cp .env.local.example .env.local

# Run dev server (port 3002 to avoid conflict with CompAtlas on 3001)
bun dev
```

Open [http://localhost:3002](http://localhost:3002)

## Data Sources

**Mock Mode (default):** Uses sample rental data in `src/data/properties.json` for development.

**MLS Mode:** Set `NEXT_PUBLIC_DATA_SOURCE=mls` in `.env.local` and configure your RETS credentials. You'll need to verify the correct rental resource/class for your MLS — update `RENTAL_CLASS` in `src/app/api/search/route.ts`.

## Key Differences from CompAtlas

| Feature | CompAtlas | RentAtlas |
|---------|-----------|-----------|
| Data | Sale comps | Rental comps |
| Price | Sale Price | Monthly Rent |
| Result | Indicated Value | Indicated Market Rent |
| Adjustments | Bedroom ($5k), Bath ($3k), SqFt ($50/sf), Age ($1k/yr) | Bedroom ($150/mo), Bath ($75/mo), SqFt ($0.50/sf/mo), Amenities |
| Amenities | N/A | Furnished, Pets, W/D, Pool, Parking, Garage, Utilities |
| Status | Sold only | Leased + Active listings |
| Scoring | 5 factors | 6 factors (adds amenity match) |

## Adjustment Values (Monthly)

- **Bedroom:** $150/mo per bedroom difference
- **Bathroom:** $75/mo per bathroom difference  
- **Square Footage:** $0.50/sqft/mo
- **Furnished:** $200/mo
- **Parking:** $75/mo per space
- **Pool:** $100/mo
- **Washer/Dryer:** $75/mo
- **Pets Allowed:** $50/mo

These defaults can be customized in `src/components/property/AdjustmentGrid.tsx`.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts    # RETS rental search endpoint
│   │   └── listings/route.ts  # Browse all listings
│   ├── page.tsx               # Main app page
│   └── layout.tsx
├── components/
│   ├── search/SubjectPropertyForm.tsx  # Subject + amenities + filters
│   ├── property/
│   │   ├── CompResultsTable.tsx    # Results with status badges
│   │   ├── AdjustmentGrid.tsx      # Rental adjustments with amenities
│   │   ├── ComparisonChart.tsx     # Visual comparison
│   │   ├── MapView.tsx             # Leaflet map
│   │   ├── PhotoComparison.tsx     # Photo grid
│   │   ├── PropertyDetailModal.tsx # Detail view with amenities
│   │   └── SubjectDetailModal.tsx
│   └── ui/
│       ├── Button.tsx
│       └── ExportButtons.tsx       # PDF + Excel export
├── lib/
│   ├── utils.ts          # Scoring, filtering, formatting
│   ├── export.ts         # PDF/Excel rent survey reports
│   └── rets-client.ts    # RETS/MLS connection (shared with CompAtlas)
├── types/property.ts     # Rental-specific types
├── services/
│   ├── mockPropertyService.ts
│   └── mlsPropertyService.ts
└── data/properties.json  # Sample rental data (Dunedin/Clearwater FL)
```

## Future Phases

- **Fair Rental Value Module:** Insurance ALE/loss-of-use calculations
- **Rent-to-Value Ratios:** Property value vs. rental income analysis
- **Trend Analytics:** Rent price movement over time by submarket
- **Vacancy Rate Tracking:** Area vacancy data
- **Multi-family Support:** Per-unit analysis for duplexes, triplexes, apartments

## Notes

- Copy your `src/app/fonts/` folder from CompAtlas (GeistVF.woff, GeistMonoVF.woff)
- Same design system (burgundy/walnut/gold) as CompAtlas
- Same RETS client — reuses your existing MLS credentials
