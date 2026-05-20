---
name: geospatial-analyst
description: |
  Geospatial analysis expertise covering GIS fundamentals, spatial data types and coordinate systems, spatial queries and joins, mapping libraries (Folium, Kepler.gl, Mapbox), geocoding, raster and vector data processing, spatial statistics, and building interactive geographic visualizations for data-driven decision making.
  Use when the user asks about geospatial analyst, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of geospatial analyst or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-science statistics python sql api-design cloud automation analysis"
  category: "data-analysis"
  subcategory: "statistics-modeling"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Geospatial Analyst

You are an expert geospatial analyst who helps teams work with location data, build spatial analyses, create interactive maps, and derive insights from geographic patterns. You understand coordinate systems, spatial data formats, spatial queries, and visualization best practices.


## When to Use

**Use this skill when:**
- User asks about geospatial analyst techniques or best practices
- User needs guidance on geospatial analyst concepts
- User wants to implement or improve their approach to geospatial analyst

**Do NOT use when:**
- The request falls outside the scope of geospatial analyst
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Data type:** Points (addresses, GPS), lines (routes, boundaries), polygons (regions, parcels)?
2. **Data format:** CSV with lat/lon, Shapefile, GeoJSON, PostGIS, or KML?
3. **Analysis goal:** Visualization, proximity analysis, clustering, route optimization, or spatial statistics?
4. **Scale:** City-level, regional, national, or global?
5. **Volume:** Hundreds, thousands, or millions of spatial records?
6. **Output:** Interactive web map, static report map, or data pipeline?
7. **Tools available:** Python (GeoPandas), R (sf), QGIS, PostGIS, or cloud (BigQuery GIS)?

---

## Coordinate Systems

### Essential Knowledge

```
Geographic Coordinates (Latitude/Longitude):
  - Measured in degrees on Earth's surface
  - Latitude: -90 (South Pole) to +90 (North Pole)
  - Longitude: -180 (International Date Line) to +180
  - NOT flat -- distances between degrees vary by latitude
  - CRS: EPSG:4326 (WGS 84) -- the GPS standard

Projected Coordinates (Meters/Feet):
  - Projected onto a flat surface
  - Measured in meters or feet
  - Required for accurate distance/area calculations
  - Different projections for different regions

Common Projections:
  EPSG:4326  - WGS 84 (GPS standard, unprojected lat/lon)
  EPSG:3857  - Web Mercator (Google Maps, Mapbox, most web maps)
  EPSG:32618 - UTM Zone 18N (New York area, meters)

Golden Rule:
  - Store data in EPSG:4326 (universal, GPS-compatible)
  - Display on web maps in EPSG:3857 (libraries handle this)
  - Calculate distances/areas in appropriate UTM zone (meters)
```

---

## Working with GeoPandas

### Loading and Basic Operations

```python
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, Polygon
import matplotlib.pyplot as plt

# Load spatial data
gdf = gpd.read_file('neighborhoods.geojson')
print(gdf.crs)  # Check coordinate reference system
print(gdf.head())
print(gdf.geometry.type.unique())  # Point, Polygon, etc.

# Create GeoDataFrame from CSV with coordinates
df = pd.read_csv('stores.csv')
geometry = [Point(xy) for xy in zip(df['longitude'], df['latitude'])]
stores = gpd.GeoDataFrame(df, geometry=geometry, crs='EPSG:4326')

# Reproject for distance calculations
stores_utm = stores.to_crs(epsg=32618)  # UTM Zone 18N (meters)

# Basic spatial operations
area = gdf.to_crs(epsg=32618).area  # area in square meters
gdf['area_km2'] = area / 1_000_000

centroid = gdf.geometry.centroid
bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]

# Quick plot
gdf.plot(column='population', cmap='YlOrRd', legend=True, figsize=(12, 8))
plt.title('Population by Neighborhood')
plt.show()
```

### Spatial Queries and Joins

```python
# Spatial join: Which neighborhood is each store in?
stores_with_hood = gpd.sjoin(stores, neighborhoods, how='left', predicate='within')
# Each store now has the attributes of its containing neighborhood

# Buffer: Find everything within 1km of each store
stores_utm = stores.to_crs(epsg=32618)
buffers = stores_utm.buffer(1000)  # 1000 meters
stores_utm['buffer'] = buffers

# Distance matrix: Distance between all pairs
from scipy.spatial.distance import cdist
coords = stores_utm.geometry.apply(lambda p: (p.x, p.y)).tolist()
distance_matrix = cdist(coords, coords)

# Nearest neighbor: Find closest store to each point
from shapely.ops import nearest_points
def find_nearest(point, others):
    distances = others.distance(point)
    return distances.idxmin(), distances.min()

# Intersections: Where do two layers overlap?
overlap = gpd.overlay(flood_zones, buildings, how='intersection')
# Result: buildings (or portions) within flood zones

# Contains, intersects, within
stores_in_manhattan = stores[stores.within(manhattan_polygon)]
roads_crossing_park = roads[roads.intersects(park_polygon)]
```

---

## Geocoding

### Converting Addresses to Coordinates

```python
from geopy.geocoders import Nominatim, GoogleV3
from geopy.extra.rate_limiter import RateLimiter
import time

# Free geocoding with Nominatim (OpenStreetMap)
geolocator = Nominatim(user_agent="my_analysis")
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)

df['location'] = df['address'].apply(geocode)
df['latitude'] = df['location'].apply(
    lambda loc: loc.latitude if loc else None
)
df['longitude'] = df['location'].apply(
    lambda loc: loc.longitude if loc else None
)

# Batch geocoding comparison
# Nominatim: Free, 1 req/sec limit, good for small batches
# Google Geocoding API: $5/1000 requests, most accurate
# Mapbox Geocoding: 100K free/month, good accuracy
# US Census Geocoder: Free, US addresses only, bulk upload
```

---

## Interactive Mapping

### Folium (Python + Leaflet)

```python
import folium
from folium.plugins import MarkerCluster, HeatMap

# Basic map
m = folium.Map(location=[40.7128, -74.0060], zoom_start=12)

# Add markers
for _, row in stores.iterrows():
    folium.Marker(
        location=[row['latitude'], row['longitude']],
        popup=folium.Popup(f"<b>{row['name']}</b><br>Sales: ${row['sales']:,.0f}",
                          max_width=200),
        icon=folium.Icon(color='blue', icon='store', prefix='fa')
    ).add_to(m)

# Marker clustering for many points
cluster = MarkerCluster().add_to(m)
for _, row in large_dataset.iterrows():
    folium.Marker([row['lat'], row['lon']]).add_to(cluster)

# Heatmap
heat_data = [[row['lat'], row['lon'], row['weight']]
             for _, row in df.iterrows()]
HeatMap(heat_data, radius=15, blur=10, max_zoom=13).add_to(m)

# Choropleth (thematic map)
folium.Choropleth(
    geo_data=neighborhoods_geojson,
    data=census_data,
    columns=['neighborhood_id', 'median_income'],
    key_on='feature.properties.id',
    fill_color='YlGn',
    fill_opacity=0.7,
    legend_name='Median Income ($)'
).add_to(m)

m.save('map.html')
```

### Kepler.gl (Large-Scale Visualization)

```python
from keplergl import KeplerGl

# Great for large datasets (100K+ points)
map_config = KeplerGl(height=600)
map_config.add_data(data=df, name='Taxi Pickups')
map_config.save_to_html(file_name='kepler_map.html')

# Kepler.gl handles:
# - Hexbin aggregation (millions of points)
# - 3D elevation maps
# - Time-series animation
# - Arc layers (origin-destination flows)
# - Automatic clustering
```

---

## Spatial Analysis Patterns

### Point Pattern Analysis

```python
# Kernel Density Estimation (KDE) - where are points concentrated?
from scipy.stats import gaussian_kde
import numpy as np

x = stores['longitude'].values
y = stores['latitude'].values
xy = np.vstack([x, y])
kde = gaussian_kde(xy, bw_method=0.1)

# Create grid for visualization
xgrid = np.linspace(x.min(), x.max(), 100)
ygrid = np.linspace(y.min(), y.max(), 100)
X, Y = np.meshgrid(xgrid, ygrid)
Z = kde(np.vstack([X.ravel(), Y.ravel()])).reshape(X.shape)

plt.contourf(X, Y, Z, levels=20, cmap='YlOrRd')
plt.scatter(x, y, c='black', s=5, alpha=0.5)
plt.title('Store Density')
plt.show()
```

### Catchment Area Analysis

```python
# Voronoi diagram: assign each point on map to nearest store
from scipy.spatial import Voronoi
from shapely.geometry import Polygon
import geopandas as gpd

# Calculate Voronoi regions
coords = stores_utm[['x', 'y']].values
vor = Voronoi(coords)

# Convert to GeoDataFrame for mapping
regions = []
for region_idx in vor.point_region:
    vertices = vor.regions[region_idx]
    if -1 not in vertices and len(vertices) > 0:
        polygon = Polygon([vor.vertices[v] for v in vertices])
        regions.append(polygon)

catchment = gpd.GeoDataFrame(geometry=regions, crs=stores_utm.crs)
```

### Spatial Autocorrelation (Moran's I)

```python
from pysal.lib import weights
from pysal.explore import esda

# Are similar values clustered together?
# Moran's I: -1 (dispersed) to +1 (clustered), 0 = random

w = weights.KNN.from_dataframe(gdf, k=5)  # 5 nearest neighbors
moran = esda.Moran(gdf['income'], w)
print(f"Moran's I: {moran.I:.4f}")
print(f"p-value: {moran.p_sim:.4f}")
# Significant positive I = spatial clustering of similar values
```

---

## Raster Data

### Working with Satellite/Elevation Data

```python
import rasterio
from rasterio.plot import show
import numpy as np

# Read raster (GeoTIFF)
with rasterio.open('elevation.tif') as src:
    elevation = src.read(1)  # Band 1
    transform = src.transform
    crs = src.crs
    print(f"Shape: {elevation.shape}")
    print(f"Resolution: {src.res}")  # pixel size in CRS units
    print(f"Bounds: {src.bounds}")

# Sample raster values at point locations
from rasterio.sample import sample
coords = [(lon, lat) for lon, lat in zip(df['longitude'], df['latitude'])]
with rasterio.open('elevation.tif') as src:
    df['elevation'] = [val[0] for val in src.sample(coords)]

# Raster calculations
slope = np.gradient(elevation)  # simplified slope
```

---

## Database: PostGIS

```sql
-- PostGIS spatial queries

-- Find stores within 5km of a point
SELECT name, ST_Distance(
    geom::geography,
    ST_MakePoint(-73.985, 40.748)::geography
) AS distance_m
FROM stores
WHERE ST_DWithin(
    geom::geography,
    ST_MakePoint(-73.985, 40.748)::geography,
    5000  -- meters
)
ORDER BY distance_m;

-- Count points per polygon (spatial join)
SELECT n.name, COUNT(s.id) AS store_count
FROM neighborhoods n
LEFT JOIN stores s ON ST_Contains(n.geom, s.geom)
GROUP BY n.name
ORDER BY store_count DESC;

-- Find nearest neighbor for each point
SELECT DISTINCT ON (a.id)
    a.id, a.name,
    b.id AS nearest_id, b.name AS nearest_name,
    ST_Distance(a.geom::geography, b.geom::geography) AS distance_m
FROM stores a, stores b
WHERE a.id != b.id
ORDER BY a.id, ST_Distance(a.geom, b.geom);

-- Create spatial index (essential for performance)
CREATE INDEX idx_stores_geom ON stores USING GIST (geom);
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to geospatial analyst
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Geospatial Analyst Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with geospatial analyst for my current situation"

**Output:**

Based on your situation, here is a structured approach to geospatial analyst:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
