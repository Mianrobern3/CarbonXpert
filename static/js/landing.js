let ciudadesData = {};

console.log('Script landing.js cargado');

// Navegación suave
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Resaltar sección activa en el menú
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 60) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

async function cargarCiudades() {
    try {
        console.log('Iniciando carga de ciudades...');
        const response = await fetch('/api/ciudades');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos de ciudades recibidos:', data);

        const selectCiudad = document.getElementById('ciudad');
        if (!selectCiudad) {
            console.error('No se encontró el elemento select#ciudad');
            return;
        }

        // Limpiar opciones existentes
        selectCiudad.innerHTML = '<option value="">Seleccione una ciudad</option>';

        // Ordenar ciudades alfabéticamente
        const ciudadesOrdenadas = data.ciudades.sort((a, b) => 
            a.nombre.localeCompare(b.nombre)
        );

        // Agregar las ciudades al select
        ciudadesOrdenadas.forEach(ciudad => {
            const option = document.createElement('option');
            option.value = ciudad.nombre;
            option.textContent = `${ciudad.nombre}, ${ciudad.departamento}`;
            selectCiudad.appendChild(option);
        });

        // Guardar datos de ciudades para uso posterior
        ciudadesData = data.ciudades.reduce((acc, ciudad) => {
            acc[ciudad.nombre] = ciudad;
            return acc;
        }, {});

    } catch (error) {
        console.error('Error al cargar ciudades:', error);
        alert('Error al cargar las ciudades. Por favor, recarga la página.');
    }
}

function actualizarInfoClimatizacion(ciudadNombre) {
    const infoDiv = document.getElementById('infoClimatizacion');
    const ciudad = ciudadesData[ciudadNombre];

    if (!ciudad) {
        infoDiv.innerHTML = '';
        return;
    }

    // Crear el contenido para los detalles del clima
    let detallesHTML = `
        <div class="clima-detalles">
            <div class="clima-item">
                <i class="fas fa-thermometer-half"></i>
                <span>Temperatura promedio: ${ciudad.clima.temperatura_promedio}°C</span>
            </div>
            <div class="clima-item">
                <i class="fas fa-tint"></i>
                <span>Humedad promedio: ${ciudad.clima.humedad_promedio}%</span>
            </div>
        </div>
    `;

    // Crear el contenido para las etiquetas de climatización
    let tagsHTML = '<div class="clima-tags">';
    
    if (ciudad.clima.aire_acondicionado) {
        tagsHTML += `
            <span class="tag aire-acondicionado">
                <i class="fas fa-snowflake"></i>
                Aire Acondicionado
            </span>
        `;
    }
    
    if (ciudad.clima.calefaccion) {
        tagsHTML += `
            <span class="tag calefaccion">
                <i class="fas fa-fire"></i>
                Calefacción
            </span>
        `;
    }
    
    tagsHTML += '</div>';

    // Actualizar el contenido
    infoDiv.innerHTML = detallesHTML + tagsHTML;
}

async function registrarUsuario(event) {
    event.preventDefault();
    console.log('Iniciando registro de usuario...');

    try {
        // Obtener todos los valores del formulario
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const ciudad = document.getElementById('ciudad').value;
        const vivienda = document.getElementById('vivienda').value;
        
        // Obtener valores de línea base
        const electricidad = parseFloat(document.getElementById('electricidad').value);
        const agua = parseFloat(document.getElementById('agua').value);
        const gas = parseFloat(document.getElementById('gas').value);

        // Validar que todos los campos estén completos
        if (!nombre || !email || !ciudad || !vivienda || !electricidad || !agua || !gas) {
            alert('Por favor complete todos los campos');
            return;
        }

        // Crear objeto de datos
        const datos = {
            nombre: nombre,
            email: email,
            ciudad: ciudad,
            vivienda: vivienda,
            lineaBase: {
                electricidad: electricidad,
                agua: agua,
                gas: gas
            }
        };

        console.log('Datos a enviar:', datos);

        // Enviar datos al servidor
        const response = await fetch('/api/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en el registro');
        }

        const responseData = await response.json();
        console.log('Respuesta del servidor:', responseData);

        // Guardar ID de usuario en localStorage
        localStorage.setItem('userId', responseData.userId);
        localStorage.setItem('userName', nombre);

        // Redireccionar al dashboard
        console.log('Redirigiendo al dashboard...');
        window.location.href = '/dashboard';

    } catch (error) {
        console.error('Error en el registro:', error);
        alert('Error en el registro: ' + error.message);
    }
}

// Funciones para el modal
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Previene el scroll
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaura el scroll
}

// Cerrar modal si se hace clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        closeLoginModal();
    }
}

// Manejar el envío del formulario de login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const userId = document.getElementById('userId').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                userId: userId
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar datos en localStorage
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('userName', data.nombre);
            
            // Redireccionar al dashboard
            window.location.href = '/dashboard';
        } else {
            alert(data.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    }
});

// Agregar escape key para cerrar el modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, configurando event listeners...');
    
    const form = document.getElementById('registroForm');
    if (form) {
        console.log('Formulario encontrado, agregando event listener...');
        form.addEventListener('submit', registrarUsuario);
    } else {
        console.error('No se encontró el formulario de registro');
    }

    // Cargar ciudades
    cargarCiudades();
});

// Función para mostrar el formulario según el tipo de usuario
function showRegistrationForm(type) {
    const registrationCard = document.querySelector('.registration-card');
    
    if (type === 'enterprise') {
        registrationCard.classList.add('enterprise');
        document.getElementById('registroForm').innerHTML = `
            <h2>Solicitar Demo Empresarial</h2>
            <div class="form-group">
                <label for="nombre">
                    <i class="fas fa-user"></i>
                    Nombre Completo
                </label>
                <input type="text" id="nombre" name="nombre" required>
            </div>
            <div class="form-group">
                <label for="email">
                    <i class="fas fa-envelope"></i>
                    Email Corporativo
                </label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="empresa">
                    <i class="fas fa-building"></i>
                    Empresa
                </label>
                <input type="text" id="empresa" name="empresa" required>
            </div>
            <div class="form-group">
                <label for="telefono">
                    <i class="fas fa-phone"></i>
                    Teléfono
                </label>
                <input type="tel" id="telefono" name="telefono" required>
            </div>
            <div class="form-group">
                <label for="mensaje">
                    <i class="fas fa-comment"></i>
                    Mensaje
                </label>
                <textarea id="mensaje" name="mensaje" rows="4"></textarea>
            </div>
            <button type="submit" class="submit-btn enterprise">
                <span>Solicitar Demo</span>
                <i class="fas fa-arrow-right"></i>
            </button>
        `;
    } else {
        registrationCard.classList.remove('enterprise');
        // Mantener el formulario original para usuarios residenciales
    }
    
    // Scroll suave hasta el formulario
    registrationCard.scrollIntoView({ behavior: 'smooth' });
}