-- PostgreSQL Schema for DepiMovil

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
    machine_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Reservations
CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    machine_id INT REFERENCES machines(machine_id),
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
    machine_id INT REFERENCES machines(machine_id),
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
    machine_id INT REFERENCES machines(machine_id),
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