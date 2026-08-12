#!/bin/bash
set -e

# Create multiple PostgreSQL databases based on POSTGRES_MULTIPLE_DATABASES env variable
# Expected format: "db1,db2,db3"

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Creating multiple databases: $POSTGRES_MULTIPLE_DATABASES"
    
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        echo "Creating database: $db"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
            CREATE DATABASE $db;
            GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;
EOSQL
    done
    
    echo "Multiple databases created successfully"
fi
