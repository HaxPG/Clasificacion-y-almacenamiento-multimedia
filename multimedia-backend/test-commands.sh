#!/bin/bash

# Script de pruebas con cURL para el backend multimedia
BASE_URL="http://localhost:3000/api"
TOKEN=""

echo "🚀 Iniciando pruebas del API con cURL..."

# Función para hacer login y obtener token
login() {
    echo "🔐 Probando login..."
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "correo": "admin@medio.com",
            "contraseña": "admin123"
        }')
    
    echo "📄 Respuesta login: $RESPONSE"
    
    # Extraer token (requiere jq)
    if command -v jq &> /dev/null; then
        TOKEN=$(echo $RESPONSE | jq -r '.token')
        echo "✅ Token obtenido: ${TOKEN:0:20}..."
    else
        echo "⚠️  jq no está instalado. Extrae el token manualmente."
    fi
}

# Test obtener usuarios
test_users() {
    echo -e "\n👥 Probando obtener usuarios..."
    curl -s -X GET "$BASE_URL/usuarios" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Test obtener archivos
test_files() {
    echo -e "\n📄 Probando obtener archivos..."
    curl -s -X GET "$BASE_URL/archivos?page=1&limit=5" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Test crear categoría
test_create_category() {
    echo -e "\n📁 Probando crear categoría..."
    curl -s -X POST "$BASE_URL/categorias" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "nombre": "Categoría Prueba cURL",
            "id_padre": null
        }' | jq '.'
}

# Test búsqueda
test_search() {
    echo -e "\n🔍 Probando búsqueda..."
    curl -s -X GET "$BASE_URL/buscar?q=presidente" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Test estadísticas
test_stats() {
    echo -e "\n📊 Probando estadísticas..."
    curl -s -X GET "$BASE_URL/estadisticas" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" | jq '.'
}

# Ejecutar todas las pruebas
main() {
    # Verificar que el servidor esté corriendo
    if ! curl -s "$BASE_URL/../" > /dev/null; then
        echo "❌ Error: El servidor no está corriendo en http://localhost:3000"
        echo "💡 Ejecuta: npm run dev"
        exit 1
    fi

    login
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        test_users
        test_files
        test_create_category
        test_search
        test_stats
    else
        echo "❌ No se pudo obtener el token. Verifica las credenciales."
    fi
    
    echo -e "\n✅ Pruebas completadas"
}

# Ejecutar script principal
main
