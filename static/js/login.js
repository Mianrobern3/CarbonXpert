document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const typeButtons = document.querySelectorAll('.type-btn');
    const registerLink = document.getElementById('registerLink');
    
    // Manejar selección de tipo de usuario
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            typeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar enlace de registro según el tipo
            const type = this.dataset.type;
            if (type === 'enterprise') {
                registerLink.href = '/registro-empresarial';
            } else {
                registerLink.href = '/registro-residencial';
            }
        });
    });
    
    // Manejar envío del formulario
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const userType = document.querySelector('.type-btn.active').dataset.type;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    userType
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Guardar token y tipo de usuario
                localStorage.setItem('token', data.token);
                localStorage.setItem('userType', data.userType);
                
                // Redirigir según el tipo de usuario
                if (data.userType === 'enterprise') {
                    window.location.href = '/dashboard-empresarial';
                } else {
                    window.location.href = '/dashboard-personal';
                }
            } else {
                alert(data.error || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }
    });
}); 