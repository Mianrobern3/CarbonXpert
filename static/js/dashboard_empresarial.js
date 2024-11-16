// Variables globales
let userData = null;
let charts = {};

// Función para cargar datos del usuario empresarial
async function cargarDatosEmpresa() {
    try {
        const response = await fetch('/api/empresa/datos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar datos');
        
        userData = await response.json();
        actualizarInterfaz();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos de la empresa');
    }
}

// Función para actualizar la interfaz
function actualizarInterfaz() {
    // Actualizar información del usuario
    document.getElementById('userName').textContent = userData.nombre;
    document.getElementById('userCompany').textContent = userData.empresa;
    
    // Actualizar estadísticas generales
    document.getElementById('totalBuildings').textContent = userData.edificios.length;
    document.getElementById('totalCarbon').textContent = calcularHuellaCarbono();
    document.getElementById('totalSavings').textContent = formatearDinero(calcularAhorros());
    
    // Actualizar gráficos
    actualizarGraficos();
    
    // Cargar alertas
    cargarAlertas();
}

// Función para actualizar gráficos
function actualizarGraficos() {
    // Gráfico de Huella de Carbono por Edificio
    const ctxCarbon = document.getElementById('carbonFootprintChart').getContext('2d');
    if (charts.carbon) charts.carbon.destroy();
    
    charts.carbon = new Chart(ctxCarbon, {
        type: 'bar',
        data: {
            labels: userData.edificios.map(e => e.nombre),
            datasets: [{
                label: 'Huella de Carbono (Ton CO₂eq)',
                data: userData.edificios.map(e => e.huellaCarbono),
                backgroundColor: '#3498db',
                borderRadius: 8
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
    
    // Gráfico de Consumo Energético
    const ctxEnergy = document.getElementById('energyConsumptionChart').getContext('2d');
    if (charts.energy) charts.energy.destroy();
    
    charts.energy = new Chart(ctxEnergy, {
        type: 'line',
        data: {
            labels: obtenerUltimos12Meses(),
            datasets: [{
                label: 'Consumo Energético (kWh)',
                data: userData.consumoEnergetico,
                borderColor: '#2ecc71',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(46, 204, 113, 0.1)'
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
}

// Función para cargar alertas
function cargarAlertas() {
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';
    
    userData.alertas.forEach(alerta => {
        const alertaElement = document.createElement('div');
        alertaElement.className = `alert-item ${alerta.tipo}`;
        alertaElement.innerHTML = `
            <i class="fas ${obtenerIconoAlerta(alerta.tipo)}"></i>
            <div class="alert-content">
                <h4>${alerta.titulo}</h4>
                <p>${alerta.mensaje}</p>
            </div>
        `;
        alertsList.appendChild(alertaElement);
    });
}

// Función para manejar la navegación
document.querySelectorAll('.nav-links li').forEach(item => {
    item.addEventListener('click', function() {
        const view = this.dataset.view;
        if (!view) return;
        
        // Actualizar navegación activa
        document.querySelectorAll('.nav-links li').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // Mostrar vista correspondiente
        document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
        
        // Cargar datos específicos de la vista
        switch(view) {
            case 'buildings':
                cargarEdificios();
                break;
            case 'reports':
                cargarReportes();
                break;
            case 'settings':
                cargarConfiguracion();
                break;
        }
    });
});

// Funciones de utilidad
function obtenerUltimos12Meses() {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fechaActual = new Date();
    const ultimos12 = [];
    
    for (let i = 11; i >= 0; i--) {
        const mes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
        ultimos12.push(meses[mes.getMonth()]);
    }
    
    return ultimos12;
}

function obtenerIconoAlerta(tipo) {
    switch(tipo) {
        case 'warning': return 'fa-exclamation-triangle';
        case 'danger': return 'fa-exclamation-circle';
        case 'success': return 'fa-check-circle';
        default: return 'fa-info-circle';
    }
}

function formatearDinero(cantidad) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(cantidad);
}

function calcularHuellaCarbono() {
    return userData.edificios.reduce((total, edificio) => total + edificio.huellaCarbono, 0).toFixed(2);
}

function calcularAhorros() {
    return userData.edificios.reduce((total, edificio) => total + edificio.ahorros, 0);
}

// Funciones de exportación
function exportarDatos() {
    // Implementar lógica de exportación
    alert('Función de exportación en desarrollo');
}

function generarReporte() {
    // Implementar lógica de generación de reportes
    alert('Función de generación de reportes en desarrollo');
}

// Función de cierre de sesión
function cerrarSesion() {
    localStorage.removeItem('token');
    window.location.href = '/';
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
    cargarDatosEmpresa();
}); 