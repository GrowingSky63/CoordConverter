import sqlite3, os

class Database:
    def __init__(self, db_name='coordinates.db'):
        appdata_dir = os.path.join(os.getenv('APPDATA'), 'Coord Convert')
        os.makedirs(appdata_dir, exist_ok=True)  # Cria o diretório se não existir
        self.db_name = os.path.join(appdata_dir, db_name)

    def __enter__(self):
        self.conn = sqlite3.connect(self.db_name)
        self.cursor = self.conn.cursor()
        # Criar a tabela se não existir, com restrição UNIQUE em (latitude, longitude)
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                latitude REAL,
                longitude REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(latitude, longitude)
            )
        ''')
        self.conn.commit()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.close()

    def insert_coordinate(self, latitude, longitude):
        self.cursor.execute('''
            INSERT INTO history (latitude, longitude, timestamp)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (latitude, longitude) DO NOTHING;
        ''', (latitude, longitude))
        self.conn.commit()

    def get_history(self):
        self.cursor.execute('''
            SELECT latitude, longitude, timestamp FROM history ORDER BY timestamp DESC LIMIT 100
        ''')
        return self.cursor.fetchall()
