-- PostgreSQL Schema for DepiMovil

-- Enum types
CREATE TYPE uso_operativo AS ENUM ('viajera', 'base_ciudad', 'solo_venta');
CREATE TYPE estado_maquina AS ENUM ('disponible', 'reservada', 'mantenimiento', 'fuera_servicio', 'en_viaje');

-- Table for Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Operators
CREATE TABLE operators (
    operator_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    license_number VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Machines
CREATE TABLE machines (
    id SERIAL PRIMARY KEY,
    codigo_interno VARCHAR(20) NOT NULL UNIQUE,
    nombre_comercial VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    uso_operativo uso_operativo DEFAULT 'base_ciudad',
    ciudad_base VARCHAR(50),
    ubicacion_actual VARCHAR(100),
    estado estado_maquina DEFAULT 'disponible',
    marca VARCHAR(100),
    modelo_tipo VARCHAR(100),
    pais_base VARCHAR(50) DEFAULT 'Uruguay',
    descripcion TEXT,
    serial_number VARCHAR(50),
    icono_url TEXT,
    foto_url TEXT,
    observaciones_tecnicas TEXT,
    ultimo_mantenimiento DATE,
    proximo_mantenimiento DATE,
    ciudades_restringidas TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering machines by city and status
CREATE INDEX idx_machines_ciudad_estado ON machines(ciudad_base, estado);
CREATE INDEX idx_machines_uso_operativo ON machines(uso_operativo);

-- Table for Reservations
CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    machine_id INT REFERENCES machines(id),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Payments
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    reservation_id INT REFERENCES reservations(reservation_id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Logistics
CREATE TABLE logistics (
    logistic_id SERIAL PRIMARY KEY,
    machine_id INT REFERENCES machines(id),
    operator_id INT REFERENCES operators(operator_id),
    scheduled_time TIMESTAMPTZ,
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Notifications
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Incidents
CREATE TABLE incidents (
    incident_id SERIAL PRIMARY KEY,
    machine_id INT REFERENCES machines(id),
    description TEXT,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE
);

-- Table for Leads
CREATE TABLE leads (
    lead_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Training
CREATE TABLE training (
    training_id SERIAL PRIMARY KEY,
    operator_id INT REFERENCES operators(operator_id),
    date TIMESTAMPTZ DEFAULT NOW(),
    topics TEXT
);

-- Table for Audit Logs
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    action VARCHAR(100),
    user_id INT REFERENCES users(user_id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add new columns to existing machines table
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS uso_operativo uso_operativo DEFAULT 'base_ciudad';
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS ciudades_restringidas TEXT[] DEFAULT '{}';
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(20);
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(100);
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS ciudad_base VARCHAR(50);
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS ubicacion_actual VARCHAR(100);
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS icono_url TEXT;
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS foto_url TEXT;
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS observaciones_tecnicas TEXT;
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS ultimo_mantenimiento DATE;
-- ALTER TABLE machines ADD COLUMN IF NOT EXISTS proximo_mantenimiento DATE;
