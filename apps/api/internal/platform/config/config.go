package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	HTTPAddr    string
	Env         string
	LogLevel    string
	CORSOrigins []string

	DB DBConfig

	JWT       JWTConfig
	Cookie    CookieConfig
	SuperUser SuperUserConfig

	PublicFormBaseURL string

	Sheets SheetsConfig
}

type DBConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
	SSLMode  string
}

func (d DBConfig) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.Name, d.SSLMode)
}

type JWTConfig struct {
	Secret string
	TTL    time.Duration
}

type CookieConfig struct {
	Name   string
	Domain string
	Secure bool
}

type SuperUserConfig struct {
	Email    string
	Password string
}

type SheetsConfig struct {
	CredentialsPath string
	SpreadsheetID   string
	Tab             string
}

func (s SheetsConfig) Enabled() bool {
	return s.CredentialsPath != "" && s.SpreadsheetID != ""
}

// Load reads .env (if present) then merges OS env. Fails fast on missing
// required values so misconfiguration is loud.
func Load() (Config, error) {
	_ = godotenv.Load(".env", "../../.env")

	port, err := atoiDefault("POSTGRES_PORT", 5432)
	if err != nil {
		return Config{}, err
	}
	ttl, err := atoiDefault("JWT_TTL_HOURS", 24)
	if err != nil {
		return Config{}, err
	}

	cfg := Config{
		HTTPAddr:    getEnv("API_HTTP_ADDR", ":8080"),
		Env:         getEnv("API_ENV", "local"),
		LogLevel:    getEnv("API_LOG_LEVEL", "info"),
		CORSOrigins: splitCSV(getEnv("API_CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")),
		DB: DBConfig{
			Host:     getEnv("POSTGRES_HOST", "localhost"),
			Port:     port,
			User:     getEnv("POSTGRES_USER", "projectx"),
			Password: getEnv("POSTGRES_PASSWORD", ""),
			Name:     getEnv("POSTGRES_DB", "projectx"),
			SSLMode:  getEnv("POSTGRES_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", ""),
			TTL:    time.Duration(ttl) * time.Hour,
		},
		Cookie: CookieConfig{
			Name:   getEnv("COOKIE_NAME", "px_session"),
			Domain: getEnv("COOKIE_DOMAIN", "localhost"),
			Secure: getEnv("COOKIE_SECURE", "false") == "true",
		},
		SuperUser: SuperUserConfig{
			Email:    getEnv("SUPER_ADMIN_EMAIL", ""),
			Password: getEnv("SUPER_ADMIN_PASSWORD", ""),
		},
		PublicFormBaseURL: getEnv("PUBLIC_FORM_BASE_URL", "http://localhost:3000"),
		Sheets: SheetsConfig{
			CredentialsPath: getEnv("GOOGLE_CREDENTIALS_PATH", ""),
			SpreadsheetID:   getEnv("GOOGLE_SHEETS_ID", ""),
			Tab:             getEnv("GOOGLE_SHEETS_TAB", "Leads"),
		},
	}

	if len(cfg.JWT.Secret) < 32 {
		return cfg, errors.New("JWT_SECRET must be at least 32 characters")
	}
	if cfg.DB.Password == "" {
		return cfg, errors.New("POSTGRES_PASSWORD is required")
	}
	return cfg, nil
}

func getEnv(k, def string) string {
	if v, ok := os.LookupEnv(k); ok && v != "" {
		return v
	}
	return def
}

func atoiDefault(k string, def int) (int, error) {
	v, ok := os.LookupEnv(k)
	if !ok || v == "" {
		return def, nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return 0, fmt.Errorf("env %s: %w", k, err)
	}
	return n, nil
}

func splitCSV(v string) []string {
	parts := strings.Split(v, ",")
	out := parts[:0]
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
