let userData = null;
let charts = {};
let gaugeHuella = null;

// Función para cargar datos del usuario
async function cargarDatosUsuario() {
    console.log('Cargando datos del usuario...');
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.error('No hay userId en localStorage');
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch(`/api/usuario/${userId}`);
        if (!response.ok) throw new Error('Error al cargar datos del usuario');
        
        userData = await response.json();
        console.log('Datos cargados:', userData);

        actualizarInfoUsuario();
        crearGraficos();
        actualizarMetricas();
        mostrarAlertas();
        mostrarRecomendaciones();
        actualizarGauge();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos del usuario');
    }
}

// Función para actualizar información del usuario
function actualizarInfoUsuario() {
    document.getElementById('userName').textContent = userData.nombre;
    document.getElementById('userCity').textContent = userData.ciudad;
    document.getElementById('fechaActual').textContent = new Date().toLocaleDateString();
}

// Función para crear gráficos
function crearGraficos() {
    // Gráfico de huella de carbono
    crearGraficoLinea(
        'graficoHuella',
        userData.huellaCarbono.meses,
        userData.huellaCarbono.datos,
        'Huella de Carbono',
        '#2ecc71'
    );

    // Gráfico de electricidad
    crearGraficoLinea(
        'graficoElectricidad',
        userData.consumos.electricidad.meses,
        userData.consumos.electricidad.datos,
        'Consumo Eléctrico',
        '#3498db'
    );

    // Gráfico de agua
    crearGraficoLinea(
        'graficoAgua',
        userData.consumos.agua.meses,
        userData.consumos.agua.datos,
        'Consumo de Agua',
        '#9b59b6'
    );

    // Gráfico de gas
    crearGraficoLinea(
        'graficoGas',
        userData.consumos.gas.meses,
        userData.consumos.gas.datos,
        'Consumo de Gas',
        '#e74c3c'
    );
}

// Función para crear gráfico de línea
function crearGraficoLinea(canvasId, labels, datos, titulo, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: datos,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Función para actualizar métricas
function actualizarMetricas() {
    const ultimoMes = userData.huellaCarbono.datos.length - 1;
    const penultimoMes = ultimoMes - 1;

    // Huella de carbono actual
    const huellaActual = userData.huellaCarbono.datos[ultimoMes];
    const huellaPrevio = userData.huellaCarbono.datos[penultimoMes];
    const variacion = ((huellaActual - huellaPrevio) / huellaPrevio) * 100;

    // Actualizar valores en el DOM
    document.getElementById('huellaTotalActual').textContent = `${huellaActual.toFixed(1)}`;
    document.getElementById('consumoElectrico').textContent = 
        `${userData.consumos.electricidad.datos[ultimoMes].toFixed(1)} kWh`;
    document.getElementById('consumoAgua').textContent = 
        `${userData.consumos.agua.datos[ultimoMes].toFixed(1)} m³`;
    document.getElementById('consumoGas').textContent = 
        `${userData.consumos.gas.datos[ultimoMes].toFixed(1)} m³`;

    const variacionElement = document.getElementById('variacionMensual');
    variacionElement.textContent = `${Math.abs(variacion).toFixed(1)}%`;
    variacionElement.className = variacion > 0 ? 'variacion-negativa' : 'variacion-positiva';
    variacionElement.textContent += variacion > 0 ? ' ↑' : ' ↓';
}

// Función para mostrar alertas
function mostrarAlertas() {
    const contenedor = document.getElementById('listaAlertas');
    contenedor.innerHTML = '';

    if (!userData.alertas || userData.alertas.length === 0) {
        contenedor.innerHTML = '<div class="no-data">No hay alertas activas</div>';
        return;
    }

    userData.alertas.forEach(alerta => {
        const alertaElement = document.createElement('div');
        alertaElement.className = `alerta-item ${alerta.tipo}`;
        alertaElement.innerHTML = `
            <i class="fas ${alerta.icono}"></i>
            <span>${alerta.mensaje}</span>
        `;
        contenedor.appendChild(alertaElement);
    });
}

// Función para mostrar recomendaciones
function mostrarRecomendaciones() {
    const contenedor = document.getElementById('listaRecomendaciones');
    contenedor.innerHTML = '';

    if (!userData.recomendaciones || userData.recomendaciones.length === 0) {
        contenedor.innerHTML = '<div class="no-data">No hay recomendaciones disponibles</div>';
        return;
    }

    userData.recomendaciones.forEach(recomendacion => {
        const recomendacionElement = document.createElement('div');
        recomendacionElement.className = `recomendacion-item ${recomendacion.tipo}`;
        recomendacionElement.innerHTML = `
            <i class="fas ${recomendacion.icono}"></i>
            <span>${recomendacion.mensaje}</span>
        `;
        contenedor.appendChild(recomendacionElement);
    });
}

// Función para actualizar el gauge
function actualizarGauge() {
    if (!gaugeHuella) {
        inicializarGauge();
    }

    const ultimaHuella = userData.huellaCarbono.datos[userData.huellaCarbono.datos.length - 1];
    const escalaMaxima = 1000; // Ajusta según tus necesidades
    let porcentaje = (ultimaHuella / escalaMaxima) * 100;
    porcentaje = Math.min(Math.max(porcentaje, 0), 100);

    gaugeHuella.set(porcentaje);
    actualizarCategoriaHuella(ultimaHuella, porcentaje);
}

// Función para inicializar el gauge
function inicializarGauge() {
    const opts = {
        angle: -0.2,
        lineWidth: 0.2,
        radiusScale: 0.9,
        pointer: {
            length: 0.6,
            strokeWidth: 0.035,
            color: '#000000'
        },
        limitMax: false,
        limitMin: false,
        colorStart: '#2ecc71',
        colorStop: '#e74c3c',
        strokeColor: '#E0E0E0',
        generateGradient: true,
        highDpiSupport: true,
        percentColors: [
            [0.0, "#2ecc71"],   // verde para bajo
            [0.5, "#f1c40f"],   // amarillo para medio
            [1.0, "#e74c3c"]    // rojo para alto
        ],
    };
    
    const target = document.getElementById('gaugeHuella');
    gaugeHuella = new Gauge(target).setOptions(opts);
    gaugeHuella.maxValue = 100;
    gaugeHuella.setMinValue(0);
    gaugeHuella.animationSpeed = 32;
}

// Función para actualizar la categoría de la huella
function actualizarCategoriaHuella(valor, porcentaje) {
    let categoria;
    if (porcentaje <= 30) {
        categoria = { tipo: 'bajo', texto: 'Huella Baja' };
    } else if (porcentaje <= 70) {
        categoria = { tipo: 'medio', texto: 'Huella Media' };
    } else {
        categoria = { tipo: 'alto', texto: 'Huella Alta' };
    }

    const gaugeLabel = document.getElementById('gaugeLabelHuella');
    gaugeLabel.innerHTML = `
        <span class="gauge-value">${valor.toFixed(1)} kg CO₂eq</span>
        <span class="gauge-category ${categoria.tipo}">${categoria.texto}</span>
    `;
}

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = '/';
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando dashboard...');
    cargarDatosUsuario();
}); 