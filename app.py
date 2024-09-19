from flask import Flask, render_template, jsonify, request
from database import Database
from pyproj import Proj
import os

app = Flask(__name__)

GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_JAVASCRIPT_KEY')

if not GOOGLE_MAPS_API_KEY:
    raise ValueError("A chave da API do Google Maps não está definida na variável de ambiente 'GOOGLE_MAPS_JAVASCRIPT_KEY'.")

@app.route('/')
def index():
    return render_template('index.html', api_key=GOOGLE_MAPS_API_KEY)

@app.route('/convert', methods=['POST'])
def convert():
    try:
        data = request.get_json()
        lat = data['lat']
        lon = data['lng']

        # Determinar a zona UTM
        utm_zone = int((lon + 180) / 6) + 1

        # Determinar o hemisfério
        hemisphere = 'N' if lat >= 0 else 'S'

        # Configurar a projeção UTM com pyproj
        proj_utm = Proj(proj='utm', zone=utm_zone, datum='WGS84', south=lat < 0)

        # Converter as coordenadas para UTM
        x, y = proj_utm(lon, lat)

        result = {
            'x': x,
            'y': y,
            'TZ': utm_zone,
            'Hemisphere': hemisphere
        }

        with Database() as db:
            db.insert_coordinate(lat, lon)

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save_coordinate', methods=['POST'])
def save_coordinate():
    try:
        data = request.get_json()
        lat = data['lat']
        lon = data['lng']

        # Salvar as coordenadas no banco de dados
        with Database() as db:
            db.insert_coordinate(lat, lon)

        return jsonify({'status': 'success'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/history', methods=['GET'])
def history():
    try:
        with Database() as db:
            history = db.get_history()
        history_list = []
        for record in history:
            lat, lon, timestamp = record
            history_list.append({
                'lat': lat,
                'lng': lon,
                'timestamp': timestamp
            })
        return jsonify(history_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
        app.run(debug=False)

