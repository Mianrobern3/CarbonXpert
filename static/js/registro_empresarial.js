document.getElementById('registroEmpresarialForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        const formData = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            empresa: document.getElementById('empresa').value,
            cargo: document.getElementById('cargo').value,
            telefono: document.getElementById('telefono').value,
            numEdificios: document.getElementById('numEdificios').value
        };

        const response = await fetch('/api/registro-empresarial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Gracias por tu registro. Nuestro equipo te contactará pronto.');
            window.location.href = '/';
        } else {
            alert(data.error || 'Error en el registro');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar el registro');
    }
}); 