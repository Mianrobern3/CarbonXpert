from flask import Flask, jsonify, request, render_template, redirect, url_for
from datetime import datetime
import json
import os
import random

app = Flask(__name__)
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(APP_ROOT, 'data', 'data.json')
CIUDADES_PATH = os.path.join(APP_ROOT, 'data', 'ciudades.json')

# Funciones de utilidad
def cargar_datos():
    if not os.path.exists(DATA_PATH):
        return {'usuarios': []}
    with open(DATA_PATH, 'r', encoding='utf-8') as file:
        return json.load(file)

def guardar_datos(datos):
    with open(DATA_PATH, 'w', encoding='utf-8') as file:
        json.dump(datos, file, ensure_ascii=False, indent=2)

def cargar_ciudades():
    with open(CIUDADES_PATH, 'r', encoding='utf-8') as file:
        return json.load(file)

# Funciones de generación de datos
def generar_datos_simulados(linea_base):
    meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
             'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    def generar_serie(base, variacion=0.2):
        return [round(base * (1 + random.uniform(-variacion, variacion)), 2) 
                for _ in range(12)]

    return {
        'electricidad': {
            'datos': generar_serie(linea_base['electricidad']),
            'meses': meses
        },
        'agua': {
            'datos': generar_serie(linea_base['agua']),
            'meses': meses
        },
        'gas': {
            'datos': generar_serie(linea_base['gas']),
            'meses': meses
        }
    }

def calcular_huella_carbono(consumos, factor_climatico=1.0):
    factor_electricidad = 0.5
    factor_agua = 0.3
    factor_gas = 2.0
    
    huella = []
    for i in range(len(consumos['electricidad']['datos'])):
        total = (consumos['electricidad']['datos'][i] * factor_electricidad * factor_climatico +
                consumos['agua']['datos'][i] * factor_agua +
                consumos['gas']['datos'][i] * factor_gas)
        huella.append(round(total, 2))
    
    return {
        "datos": huella,
        "meses": consumos['electricidad']['meses']
    }

def generar_alertas(consumos, huella_carbono):
    alertas = []
    
    # Obtener últimos consumos
    ultimo_mes = -1
    penultimo_mes = -2
    
    # Alertas de electricidad
    if consumos['electricidad']['datos'][ultimo_mes] > consumos['electricidad']['datos'][penultimo_mes] * 1.1:
        alertas.append({
            'tipo': 'warning',
            'mensaje': 'El consumo eléctrico aumentó más del 10% respecto al mes anterior',
            'icono': 'fa-bolt'
        })
    
    # Alertas de agua
    if consumos['agua']['datos'][ultimo_mes] > consumos['agua']['datos'][penultimo_mes] * 1.15:
        alertas.append({
            'tipo': 'warning',
            'mensaje': 'El consumo de agua aumentó más del 15% respecto al mes anterior',
            'icono': 'fa-tint'
        })
    
    # Alertas de gas
    if consumos['gas']['datos'][ultimo_mes] > consumos['gas']['datos'][penultimo_mes] * 1.2:
        alertas.append({
            'tipo': 'warning',
            'mensaje': 'El consumo de gas aumentó más del 20% respecto al mes anterior',
            'icono': 'fa-fire'
        })
    
    # Alerta de huella de carbono
    if huella_carbono['datos'][ultimo_mes] > huella_carbono['datos'][penultimo_mes]:
        alertas.append({
            'tipo': 'danger',
            'mensaje': 'Tu huella de carbono está aumentando',
            'icono': 'fa-leaf'
        })
    
    return alertas

def generar_recomendaciones(consumos, ciudad_info):
    recomendaciones = []
    
    # Recomendaciones básicas
    recomendaciones.extend([
        {
            'tipo': 'ahorro',
            'mensaje': 'Cambia a iluminación LED para reducir el consumo eléctrico',
            'icono': 'fa-lightbulb'
        },
        {
            'tipo': 'ahorro',
            'mensaje': 'Instala aireadores en grifos para reducir el consumo de agua',
            'icono': 'fa-tint'
        },
        {
            'tipo': 'eficiencia',
            'mensaje': 'Revisa el aislamiento de ventanas y puertas',
            'icono': 'fa-home'
        }
    ])
    
    # Recomendaciones específicas según la ciudad
    if ciudad_info.get('clima', {}).get('aire_acondicionado'):
        recomendaciones.append({
            'tipo': 'climatizacion',
            'mensaje': 'Mantén el aire acondicionado a 24°C para optimizar el consumo',
            'icono': 'fa-snowflake'
        })
    
    if ciudad_info.get('clima', {}).get('calefaccion'):
        recomendaciones.append({
            'tipo': 'climatizacion',
            'mensaje': 'Mantén la calefacción a 21°C para optimizar el consumo',
            'icono': 'fa-temperature-high'
        })
    
    return recomendaciones

# Rutas de la aplicación
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/ciudades', methods=['GET'])
def obtener_ciudades():
    try:
        print("Solicitud de ciudades recibida") # Debug
        datos_ciudades = cargar_ciudades()
        print(f"Datos cargados: {len(datos_ciudades['ciudades'])} ciudades") # Debug
        return jsonify(datos_ciudades)
    except Exception as e:
        print(f"Error al cargar ciudades: {str(e)}") # Debug
        return jsonify({'error': str(e)}), 500

@app.route('/api/registro', methods=['POST'])
def registro():
    try:
        print("Recibiendo solicitud de registro...")  # Debug
        datos = cargar_datos()
        nuevo_usuario = request.json
        
        print(f"Datos recibidos: {nuevo_usuario}")  # Debug
        
        # Validar datos requeridos
        campos_requeridos = ['nombre', 'email', 'ciudad', 'vivienda', 'lineaBase']
        for campo in campos_requeridos:
            if campo not in nuevo_usuario:
                raise ValueError(f"Falta el campo requerido: {campo}")
        
        # Validar línea base
        for campo in ['electricidad', 'agua', 'gas']:
            if campo not in nuevo_usuario['lineaBase']:
                raise ValueError(f"Falta el valor de línea base para: {campo}")
        
        # Generar nuevo ID
        nuevo_id = len(datos['usuarios']) + 1
        
        # Obtener factor climático
        ciudades = cargar_ciudades()
        ciudad_info = next((c for c in ciudades['ciudades'] if c['nombre'] == nuevo_usuario['ciudad']), None)
        
        if not ciudad_info:
            raise ValueError(f"Ciudad no válida: {nuevo_usuario['ciudad']}")
            
        factor_climatico = ciudad_info.get('clima', {}).get('factor_consumo', 1.0)
        
        # Generar datos
        consumos = generar_datos_simulados(nuevo_usuario['lineaBase'])
        huella_carbono = calcular_huella_carbono(consumos, factor_climatico)
        
        # Generar alertas y recomendaciones
        alertas = generar_alertas(consumos, huella_carbono)
        recomendaciones = generar_recomendaciones(consumos, ciudad_info)
        
        usuario_completo = {
            'id': nuevo_id,
            'nombre': nuevo_usuario['nombre'],
            'email': nuevo_usuario['email'],
            'ciudad': nuevo_usuario['ciudad'],
            'vivienda': nuevo_usuario['vivienda'],
            'lineaBase': nuevo_usuario['lineaBase'],
            'consumos': consumos,
            'huellaCarbono': huella_carbono,
            'alertas': alertas,
            'recomendaciones': recomendaciones,
            'fechaRegistro': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        print(f"Usuario creado: {usuario_completo['id']}")  # Debug
        
        datos['usuarios'].append(usuario_completo)
        guardar_datos(datos)
        
        return jsonify({
            'userId': nuevo_id,
            'message': 'Registro exitoso'
        })
        
    except ValueError as ve:
        print(f"Error de validación: {str(ve)}")  # Debug
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        print(f"Error interno: {str(e)}")  # Debug
        return jsonify({'error': f'Error en el registro: {str(e)}'}), 500

@app.route('/api/usuario/<int:user_id>', methods=['GET'])
def obtener_usuario(user_id):
    try:
        datos = cargar_datos()
        usuario = next((u for u in datos['usuarios'] if u['id'] == user_id), None)
        if usuario:
            return jsonify(usuario)
        return jsonify({'error': 'Usuario no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login-page')
def login_page():
    return render_template('login.html')

@app.route('/api/auth/login', methods=['POST'])
def login_auth():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        user_type = data.get('userType')
        
        # Este es un ejemplo simple - deberías implementar una verificación real
        if user_type == 'residential':
            # Verificar credenciales residenciales
            if email == 'usuario@example.com' and password == 'password':
                return jsonify({
                    'token': 'token_ejemplo_residencial',
                    'message': 'Login exitoso',
                    'userType': 'residential'
                })
        elif user_type == 'enterprise':
            # Verificar credenciales empresariales
            if email == 'empresa@example.com' and password == 'password':
                return jsonify({
                    'token': 'token_ejemplo_empresa',
                    'message': 'Login exitoso',
                    'userType': 'enterprise'
                })
                
        return jsonify({'error': 'Credenciales inválidas'}), 401
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/registro-residencial')
def registro_residencial():
    return render_template('registro_residencial.html')

@app.route('/registro-empresarial')
def registro_empresarial():
    return render_template('registro_empresarial.html')

@app.route('/api/registro-empresarial', methods=['POST'])
def registro_empresarial_api():
    try:
        datos = request.json
        
        # Validar datos requeridos
        campos_requeridos = ['nombre', 'email', 'empresa', 'cargo', 'telefono', 'numEdificios']
        for campo in campos_requeridos:
            if campo not in datos:
                raise ValueError(f"Falta el campo requerido: {campo}")
        
        # Aquí puedes agregar la lógica para guardar los datos empresariales
        # Por ahora, solo enviaremos una respuesta de éxito
        
        return jsonify({
            'message': 'Solicitud recibida con éxito',
            'status': 'success'
        })
        
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/empresa/datos', methods=['GET'])
def obtener_datos_empresa():
    try:
        # Aquí deberías implementar la lógica para obtener los datos reales
        # Este es un ejemplo de datos de prueba
        datos = {
            "nombre": "Juan Pérez",
            "empresa": "Constructora XYZ",
            "edificios": [
                {
                    "nombre": "Edificio A",
                    "huellaCarbono": 125.4,
                    "ahorros": 1500000
                },
                {
                    "nombre": "Edificio B",
                    "huellaCarbono": 98.2,
                    "ahorros": 2300000
                }
            ],
            "consumoEnergetico": [4500, 4200, 4800, 4300, 4600, 4100, 4700, 4400, 4200, 4500, 4300, 4600],
            "alertas": [
                {
                    "tipo": "warning",
                    "titulo": "Consumo Elevado",
                    "mensaje": "El Edificio A muestra un consumo superior al promedio"
                },
                {
                    "tipo": "success",
                    "titulo": "Meta Alcanzada",
                    "mensaje": "El Edificio B ha alcanzado la meta de reducción mensual"
                }
            ]
        }
        return jsonify(datos)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/dashboard-empresarial')
def dashboard_empresarial():
    # Aquí deberías verificar el token y los permisos
    return render_template('dashboard_empresarial.html')

@app.route('/dashboard-personal')
def dashboard_personal():
    # Aquí deberías verificar el token y los permisos
    return render_template('dashboard_personal.html')

@app.route('/api/usuario/datos')
def datos_usuario():
    # Aquí deberías implementar la lógica real para obtener los datos del usuario
    # Este es un ejemplo de datos de prueba
    return jsonify({
        "nombre": "Juan Pérez",
        "ciudad": "Bogotá",
        "huellaCarbono": 2.5,
        "consumo": {
            "electricidad": 300,
            "agua": 150,
            "gas": 50
        },
        "historico": [
            {"mes": "Ene", "valor": 2.8},
            {"mes": "Feb", "valor": 2.6},
            {"mes": "Mar", "valor": 2.5},
            {"mes": "Abr", "valor": 2.3},
            {"mes": "May", "valor": 2.5}
        ],
        "recomendaciones": [
            {
                "icono": "fas fa-lightbulb",
                "titulo": "Cambio a LED",
                "descripcion": "Cambia tus bombillas tradicionales por LED para ahorrar hasta un 80% de energía."
            },
            {
                "icono": "fas fa-shower",
                "titulo": "Consumo de Agua",
                "descripcion": "Instala aireadores en tus grifos para reducir el consumo de agua."
            }
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 