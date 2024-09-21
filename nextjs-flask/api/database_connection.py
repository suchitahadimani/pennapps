import logging
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_database_client():
    uri = "mongodb+srv://suchitahadimani:khakiai@kc-cluster.rqbkagx.mongodb.net/?retryWrites=true&w=majority&appName=kc-cluster"
    try:
        client = MongoClient(uri, server_api=ServerApi('1'))
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")
        return client
    except Exception as e:
        logger.error(f"An error occurred while connecting to MongoDB: {e}")
        return None

def get_database(database_name):
    client = get_database_client()
    if client:
        return client[database_name]
    logger.error(f"Failed to get database '{database_name}'. Client is None.")
    return None