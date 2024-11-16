// Variables globales
let userData = null;
let charts = {};

// Función para cargar datos del usuario
async function cargarDatosUsuario() {
    try {
        const response = await fetch('/api/usuario/datos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar datos');
        
        userData = await response.json();
        actualizarInterfaz();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos del usuario');
    }
}

// Función para actualizar la interfaz
function actualizarInterfaz() {
    // Actualizar información del usuario
    document.getElementById('userName').textContent = userData.nombre;
    document.getElementById('userLocation').textContent = userData.ciudad;
    
    // Actualizar estadísticas
    document.getElementById('totalCarbon').textContent = userData.huellaCarbono.toFixed(2);
    
    // Actualizar gráficos
    actualizarGraficos();
    
    // Cargar recomendaciones
    cargarRecomendaciones();
}

// Función para actualizar gráficos
function actualizarGraficos() {
    // Gráfico de Consumo por Categoría
    const ctxConsumo = document.getElementById('consumoChart').getContext('2d');
    if (charts.consumo) charts.consumo.destroy();
    
    charts.consumo = new Chart(ctxConsumo, {
        type: 'doughnut',
        data: {
            labels: ['Electricidad', 'Agua', 'Gas'],
            datasets: [{
                data: [
                    userData.consumo.electricidad,
                    userData.consumo.agua,
                    userData.consumo.gas
                ],
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#e74c3c'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Gráfico Histórico
    const ctxHistorico = document.getElementById('historicoChart').getContext('2d');
    if (charts.historico) charts.historico.destroy();
    
    charts.historico = new Chart(ctxHistorico, {
        type: 'line',
        data: {
            labels: userData.historico.map(h => h.mes),
            datasets: [{
                label: 'Huella de Carbono',
                data: userData.historico.map(h => h.valor),
                borderColor: '#2ecc71',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Función para cargar recomendaciones
function cargarRecomendaciones() {
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = '';
    
    userData.recomendaciones.forEach(recomendacion => {
        const recomendacionElement = document.createElement('div');
        recomendacionElement.className = 'recommendation-item';
        recomendacionElement.innerHTML = `
            <i class="${recomendacion.icono}"></i>
            <div class="recommendation-content">
                <h4>${recomendacion.titulo}</h4>
                <p>${recomendacion.descripcion}</p>
            </div>
        `;
        recommendationsList.appendChild(recomendacionElement);
    });
}

// Navegación
document.querySelectorAll('.nav-links li[data-view]').forEach(item => {
    item.addEventListener('click', function() {
        const view = this.dataset.view;
        
        // Actualizar navegación activa
        document.querySelectorAll('.nav-links li').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // Mostrar vista correspondiente
        document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
    });
});

// Función para cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    window.location.href = '/login-page';
}

// Función para descargar reporte
function descargarReporte() {
    // Implementar lógica de descarga
    alert('Descarga de reporte en desarrollo');
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Mostrar fecha actual
    const fechaActual = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('fechaActual').textContent = fechaActual;
    
    // Cargar datos iniciales
    cargarDatosUsuario();
}); 