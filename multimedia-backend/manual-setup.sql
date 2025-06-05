-- Script SQL manual para crear la base de datos
-- Ejecuta esto directamente en MySQL Workbench o phpMyAdmin

CREATE DATABASE IF NOT EXISTS Multimedia;
USE Multimedia;

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contraseña_hash TEXT NOT NULL,
    rol ENUM('Administrador', 'Periodista', 'Visualizador') NOT NULL
);

-- Crear tabla categorias
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_padre INT DEFAULT NULL,
    FOREIGN KEY (id_padre) REFERENCES categorias(id_categoria) ON DELETE SET NULL
);

-- Crear tabla archivos
CREATE TABLE IF NOT EXISTS archivos (
    id_archivo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo ENUM('imagen', 'documento', 'audio', 'video') NOT NULL,
    ruta_storage TEXT NOT NULL,
    miniatura TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fuente VARCHAR(100),
    lugar_captura VARCHAR(100),
    fecha_captura DATE,
    derechos_uso TEXT,
    nivel_acceso ENUM('público', 'restringido', 'confidencial'),
    id_usuario INT,
    id_categoria INT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- Crear tabla tags
CREATE TABLE IF NOT EXISTS tags (
    id_tag INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Crear tabla archivo_tags
CREATE TABLE IF NOT EXISTS archivo_tags (
    id_archivo INT,
    id_tag INT,
    PRIMARY KEY (id_archivo, id_tag),
    FOREIGN KEY (id_archivo) REFERENCES archivos(id_archivo) ON DELETE CASCADE,
    FOREIGN KEY (id_tag) REFERENCES tags(id_tag) ON DELETE CASCADE
);

-- Crear tabla colecciones
CREATE TABLE IF NOT EXISTS colecciones (
    id_coleccion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

-- Crear tabla archivo_coleccion
CREATE TABLE IF NOT EXISTS archivo_coleccion (
    id_archivo INT,
    id_coleccion INT,
    PRIMARY KEY (id_archivo, id_coleccion),
    FOREIGN KEY (id_archivo) REFERENCES archivos(id_archivo) ON DELETE CASCADE,
    FOREIGN KEY (id_coleccion) REFERENCES colecciones(id_coleccion) ON DELETE CASCADE
);

-- Crear tabla secciones_periodico
CREATE TABLE IF NOT EXISTS secciones_periodico (
    id_seccion INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Crear tabla archivo_seccion
CREATE TABLE IF NOT EXISTS archivo_seccion (
    id_archivo INT,
    id_seccion INT,
    PRIMARY KEY (id_archivo, id_seccion),
    FOREIGN KEY (id_archivo) REFERENCES archivos(id_archivo) ON DELETE CASCADE,
    FOREIGN KEY (id_seccion) REFERENCES secciones_periodico(id_seccion) ON DELETE CASCADE
);

-- Insertar usuarios de prueba (contraseñas hasheadas con bcrypt)
INSERT INTO usuarios (nombre, correo, contraseña_hash, rol) VALUES
('Admin Principal', 'admin@medio.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador'),
('Juana Periodista', 'periodista@medio.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Periodista'),
('Pedro Visualizador', 'visualizador@medio.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Visualizador');

-- Insertar categorías
INSERT INTO categorias (nombre, id_padre) VALUES
('Imágenes', NULL),
('Videos', NULL),
('Documentos', NULL),
('Audios', NULL),
('Reportajes', 1),
('Portadas', 1);

-- Insertar tags
INSERT INTO tags (nombre) VALUES
('elecciones'),
('deportes'),
('protesta'),
('cultura'),
('entrevista');

-- Insertar secciones
INSERT INTO secciones_periodico (nombre) VALUES
('Nacional'),
('Internacional'),
('Cultura'),
('Deportes'),
('Opinión');

-- Insertar colecciones
INSERT INTO colecciones (nombre, descripcion) VALUES
('Elecciones 2024', 'Archivos relacionados con las elecciones presidenciales'),
('Deportes Locales', 'Cobertura deportiva local');
