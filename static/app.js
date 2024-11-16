const API_URL = 'http://localhost:5000/api';

// Función para crear gráficos
function crearGrafico(canvasId, datos, label, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.meses,
            datasets: [{
                label: label,
                data: datos.datos,
                borderColor: color,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

// Cargar datos y crear gráficos
async function cargarDatos() {
    try {
        const response = await fetch(`${API_URL}/datos`);
        const datos = await response.json();
        
        crearGrafico('consumoElectricidad', datos.electricidad, 'Consumo Eléctrico (kWh)', '#ff6384');
        crearGrafico('consumoAgua', datos.agua, 'Consumo de Agua (m³)', '#36a2eb');
        crearGrafico('consumoGas', datos.gas, 'Consumo de Gas (m³)', '#ffce56');
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

// Cargar alertas
async function cargarAlertas() {
    try {
        const response = await fetch(`${API_URL}/alertas`);
        const alertas = await response.json();
        const contenedor = document.getElementById('listaAlertas');
        
        contenedor.innerHTML = alertas.map(alerta => `
            <div class="alerta ${alerta.tipo}">
                ${alerta.mensaje}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar las alertas:', error);
    }
}

// Cargar recomendaciones
async function cargarRecomendaciones() {
    try {
        const response = await fetch(`${API_URL}/recomendaciones`);
        const recomendaciones = await response.json();
        const contenedor = document.getElementById('listaRecomendaciones');
        
        contenedor.innerHTML = recomendaciones.map(recomendacion => `
            <div class="recomendacion">
                ${recomendacion}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar las recomendaciones:', error);
    }
}

// Inicializar la aplicación
window.addEventListener('load', () => {
    cargarDatos();
    cargarAlertas();
    cargarRecomendaciones();
}); 