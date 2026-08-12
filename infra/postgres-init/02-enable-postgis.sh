#!/bin/bash
set -e

# Enable PostGIS extension on databases that need spatial capabilities
# farms_db and analysis_db require PostGIS

SPATIAL_DATABASES="farms_db analysis_db"

echo "Enabling PostGIS extension on spatial databases"

for db in $SPATIAL_DATABASES; do
    echo "Enabling PostGIS on: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname="$db" <<-EOSQL
        CREATE EXTENSION IF NOT EXISTS postgis;
        CREATE EXTENSION IF NOT EXISTS postgis_topology;
EOSQL
done

echo "PostGIS extension enabled successfully"
