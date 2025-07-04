"""
Database Configuration for KPI Server
Handles database connection setup and configuration management
"""

import os
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
import logging
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConfig:
    """Database configuration and connection management"""

    def __init__(self):
        # Database connection parameters
        self.db_config = {
            'host': os.getenv('DB_HOST'),
            'port': os.getenv('DB_PORT'),
            'database': os.getenv('DB_NAME'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD')
        }

        # Connection pool
        self.connection_pool = None
        self.min_connections = 1
        self.max_connections = 10

        # SQLAlchemy engine for pandas compatibility
        self._engine = None

    def initialize_pool(self):
        """Initialize database connection pool"""
        try:
            self.connection_pool = SimpleConnectionPool(
                self.min_connections,
                self.max_connections,
                **self.db_config
            )
            logger.info("Database connection pool initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise

    @contextmanager
    def get_connection(self):
        """Get database connection from pool"""
        if not self.connection_pool:
            self.initialize_pool()

        connection = None
        try:
            connection = self.connection_pool.getconn()
            yield connection
        except Exception as e:
            if connection:
                connection.rollback()
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if connection:
                self.connection_pool.putconn(connection)

    def test_connection(self):
        """Test database connection"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                logger.info("Database connection test successful")
                return True
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False

    def get_engine(self):
        """Get SQLAlchemy engine for pandas compatibility"""
        if not self._engine:
            connection_string = (
                f"postgresql://{self.db_config['user']}:{self.db_config['password']}"
                f"@{self.db_config['host']}:{self.db_config['port']}/{self.db_config['database']}"
            )
            self._engine = create_engine(
                connection_string,
                poolclass=QueuePool,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True
            )
        return self._engine

    def close_pool(self):
        """Close all connections in the pool"""
        if self.connection_pool:
            self.connection_pool.closeall()
            logger.info("Database connection pool closed")
        if self._engine:
            self._engine.dispose()
            logger.info("SQLAlchemy engine disposed")

# Global database instance
db = DatabaseConfig()