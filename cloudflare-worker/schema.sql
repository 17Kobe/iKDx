-- 用戶表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    provider TEXT NOT NULL, -- 'google', 'facebook'
    provider_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    last_login_at TEXT
);

-- 創建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);

-- 用戶設定表
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_user_settings_key ON user_settings(user_id, setting_key);

-- 用戶股票關注表
CREATE TABLE user_stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_code TEXT NOT NULL,
    stock_name TEXT,
    added_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_user_stocks ON user_stocks(user_id, stock_code);

-- 用戶投資組合表
CREATE TABLE user_portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_code TEXT NOT NULL,
    stock_name TEXT,
    shares INTEGER NOT NULL DEFAULT 0,
    avg_cost REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_user_portfolios ON user_portfolios(user_id, stock_code);

-- 用戶交易記錄表
CREATE TABLE user_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_code TEXT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'buy', 'sell'
    shares INTEGER NOT NULL,
    price REAL NOT NULL,
    total_amount REAL NOT NULL,
    fee REAL DEFAULT 0,
    transaction_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_transactions_user ON user_transactions(user_id);
CREATE INDEX idx_user_transactions_date ON user_transactions(transaction_date);

-- 用戶登入記錄表
CREATE TABLE user_login_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    login_method TEXT NOT NULL, -- 'google', 'facebook'
    ip_address TEXT,
    user_agent TEXT,
    login_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_login_logs_user ON user_login_logs(user_id);
CREATE INDEX idx_login_logs_date ON user_login_logs(login_at);
