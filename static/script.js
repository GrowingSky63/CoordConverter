let map;
let marker;

function initMap() {
    // Coordenadas iniciais (Centro do mapa)
    const initialPosition = { lat: -25.067039, lng: -50.213364 }; // Brasília, Brasil

    map = new google.maps.Map(document.getElementById("map"), {
        center: initialPosition,
        zoom: 13,
    });

    // Evento de clique no mapa
    map.addListener("click", (mapsMouseEvent) => {
        const clickedLatLng = mapsMouseEvent.latLng;

        // Atualizar as coordenadas nos campos
        updateAllCoordinates(clickedLatLng.lat(), clickedLatLng.lng());
    });
    loadHistory();
}

function saveCoordinate(lat, lng) {
    fetch('/save_coordinate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lat: lat, lng: lng })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Atualizar o histórico após salvar
            loadHistory();
        } else {
            console.error('Erro ao salvar coordenada:', data.error);
        }
    })
    .catch(error => {
        console.error('Erro ao salvar coordenada:', error);
    });
}

function loadHistory() {
    fetch('/history')
    .then(response => response.json())
    .then(data => {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = ''; // Limpar lista atual

        data.forEach(item => {
            const li = document.createElement('li');
            const date = new Date(item.timestamp);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.toTimeString().slice(0, 5)}`;
                    
            li.textContent = `${formattedDate} -> ${item.lat.toFixed(6)}, ${item.lng.toFixed(6)}`;
            li.addEventListener('click', () => {
                // Atualizar coordenadas ao clicar no item do histórico
                updateAllCoordinates(item.lat, item.lng, true);
            });
            historyList.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Erro ao carregar o histórico:', error);
    });
}

// Função para atualizar todas as coordenadas
function updateAllCoordinates(lat, lng, recenter=false) {
    // Atualizar DEG
    document.getElementById('coord_info_DEG_lat').value = lat.toFixed(6);
    document.getElementById('coord_info_DEG_lon').value = lng.toFixed(6);

    // Atualizar GMS
    const gms = degToGMS(lat, lng);
    document.getElementById('coord_info_GMS_graus_lat').value = gms.lat.degrees;
    document.getElementById('coord_info_GMS_minuto_lat').value = gms.lat.minutes;
    document.getElementById('coord_info_GMS_segundo_lat').value = gms.lat.seconds.toFixed(2);
    document.getElementById('coord_info_GMS_LatQuad').value = gms.lat.direction;

    document.getElementById('coord_info_GMS_graus_lon').value = gms.lon.degrees;
    document.getElementById('coord_info_GMS_minuto_lon').value = gms.lon.minutes;
    document.getElementById('coord_info_GMS_segundo_lon').value = gms.lon.seconds.toFixed(2);
    document.getElementById('coord_info_GMS_LonQuad').value = gms.lon.direction;

    // Atualizar UTM
    const utm = degToUTM(lat, lng);
    document.getElementById('coord_info_UTM_x').value = utm.x.toFixed(3);
    document.getElementById('coord_info_UTM_y').value = utm.y.toFixed(3);
    document.getElementById('coord_info_UTM_fuso').value = utm.zoneNumber;
    document.getElementById('coord_info_UTM_hemisferio').value = utm.hemisphere;

    // Atualizar o marcador no mapa
    updateMarker(lat, lng, recenter=recenter);
}

// Função para atualizar o marcador no mapa
function updateMarker(lat, lng, recenter=false) {
    const position = { lat: lat, lng: lng };
    if (marker) {
        marker.setPosition(position);
    } else {
        marker = new google.maps.Marker({
            position: position,
            map: map,
        });
    }
    saveCoordinate(lat, lng);
    loadHistory();
    if (recenter) {map.setCenter(position)}
}

// Funções de conversão
function degToGMS(lat, lng) {
    // Conversão de graus decimais para graus, minutos e segundos
    const latGMS = convertToGMS(lat, 'lat');
    const lngGMS = convertToGMS(lng, 'lon');

    return {
        lat: latGMS,
        lon: lngGMS
    };
}

function convertToGMS(deg, type) {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = (minutesNotTruncated - minutes) * 60;

    const direction = type === 'lat' ?
        (deg >= 0 ? 'N' : 'S') :
        (deg >= 0 ? 'E' : 'W');

    return {
        degrees: degrees,
        minutes: minutes,
        seconds: seconds,
        direction: direction
    };
}

function degToUTM(lat, lng) {
    // Configuração da projeção UTM
    const proj4UTM = proj4('EPSG:4326', '+proj=utm +zone=' + getUTMZone(lng) + (lat < 0 ? ' +south' : ''));

    const [x, y] = proj4UTM.forward([lng, lat]);

    return {
        x: x,
        y: y,
        zoneNumber: getUTMZone(lng),
        hemisphere: lat >= 0 ? 'N' : 'S'
    };
}

function getUTMZone(lon) {
    return Math.floor((lon + 180) / 6) + 1;
}

function GMSdegToDec(degrees, minutes, seconds, direction) {
    let dd = Number(degrees) + Number(minutes)/60 + Number(seconds)/(60*60);
    if (direction === 'S' || direction === 'W') {
        dd = dd * -1;
    }
    return dd;
}

function UTMToDeg(x, y, zoneNumber, hemisphere) {
    const projString = '+proj=utm +zone=' + zoneNumber + (hemisphere === 'S' ? ' +south' : '');
    const proj4UTM = proj4('EPSG:4326', projString);

    const [lng, lat] = proj4UTM.inverse([x, y]);

    return { lat: lat, lng: lng };
}

// Eventos dos botões "Copiar" e "Pesquisar"

// DEG
document.getElementById('copy_btn_DEG').addEventListener('click', () => {
    const lat = document.getElementById('coord_info_DEG_lat').value;
    const lon = document.getElementById('coord_info_DEG_lon').value;
    const coordsText = `${lat}, ${lon}`;
    copyToClipboard(coordsText);
});

document.getElementById('search_btn_DEG').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('coord_info_DEG_lat').value);
    const lon = parseFloat(document.getElementById('coord_info_DEG_lon').value);
    if (isValidLatLng(lat, lon)) {
        updateAllCoordinates(lat, lon, true);
    } else {
        alert('Coordenadas inválidas em graus decimais.');
    }
});

// GMS
document.getElementById('copy_btn_GMS').addEventListener('click', () => {
    const latDegrees = document.getElementById('coord_info_GMS_graus_lat').value;
    const latMinutes = document.getElementById('coord_info_GMS_minuto_lat').value;
    const latSeconds = document.getElementById('coord_info_GMS_segundo_lat').value;
    const latDirection = document.getElementById('coord_info_GMS_LatQuad').value;

    const lonDegrees = document.getElementById('coord_info_GMS_graus_lon').value;
    const lonMinutes = document.getElementById('coord_info_GMS_minuto_lon').value;
    const lonSeconds = document.getElementById('coord_info_GMS_segundo_lon').value;
    const lonDirection = document.getElementById('coord_info_GMS_LonQuad').value;

    const coordsText = `${latDegrees}°${latMinutes}'${latSeconds}"${latDirection} ${lonDegrees}°${lonMinutes}'${lonSeconds}"${lonDirection}`;
    copyToClipboard(coordsText);
});

document.getElementById('search_btn_GMS').addEventListener('click', () => {
    const latDegrees = document.getElementById('coord_info_GMS_graus_lat').value;
    const latMinutes = document.getElementById('coord_info_GMS_minuto_lat').value;
    const latSeconds = document.getElementById('coord_info_GMS_segundo_lat').value;
    const latDirection = document.getElementById('coord_info_GMS_LatQuad').value;

    const lonDegrees = document.getElementById('coord_info_GMS_graus_lon').value;
    const lonMinutes = document.getElementById('coord_info_GMS_minuto_lon').value;
    const lonSeconds = document.getElementById('coord_info_GMS_segundo_lon').value;
    const lonDirection = document.getElementById('coord_info_GMS_LonQuad').value;

    const lat = GMSdegToDec(latDegrees, latMinutes, latSeconds, latDirection);
    const lon = GMSdegToDec(lonDegrees, lonMinutes, lonSeconds, lonDirection);

    if (isValidLatLng(lat, lon)) {
        updateAllCoordinates(lat, lon, true);
    } else {
        alert('Coordenadas GMS inválidas.');
    }
});

// UTM
document.getElementById('copy_btn_UTM').addEventListener('click', () => {
    const x = document.getElementById('coord_info_UTM_x').value;
    const y = document.getElementById('coord_info_UTM_y').value;
    const zoneNumber = document.getElementById('coord_info_UTM_fuso').value;
    const hemisphere = document.getElementById('coord_info_UTM_hemisferio').value;

    const coordsText = `${x},${y}`;
    copyToClipboard(coordsText);
});

document.getElementById('search_btn_UTM').addEventListener('click', () => {
    const x = parseFloat(document.getElementById('coord_info_UTM_x').value);
    const y = parseFloat(document.getElementById('coord_info_UTM_y').value);
    const zoneNumber = parseInt(document.getElementById('coord_info_UTM_fuso').value);
    const hemisphere = document.getElementById('coord_info_UTM_hemisferio').value.toUpperCase();

    if (isValidUTM(x, y, zoneNumber, hemisphere)) {
        const degCoords = UTMToDeg(x, y, zoneNumber, hemisphere);
        updateAllCoordinates(degCoords.lat, degCoords.lng, true);
    } else {
        alert('Coordenadas UTM inválidas.');
    }
});

// Funções auxiliares
function copyToClipboard(text) {
    navigator.clipboard.writeText(text.trim())
        .then(() => {
            console.log('Coordenadas copiadas para a área de transferência!');
        })
        .catch(err => {
            console.error('Erro ao copiar:', err);
        });
}

function isValidLatLng(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function isValidUTM(x, y, zoneNumber, hemisphere) {
    return zoneNumber >= 1 && zoneNumber <= 60 && (hemisphere === 'N' || hemisphere === 'S');
}

// Inicializar o mapa após o carregamento da página
window.onload = initMap;
