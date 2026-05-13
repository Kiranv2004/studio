package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/projectx/api/internal/platform/config"
	"github.com/projectx/api/internal/platform/db"
)

func main() {
	cfg, _ := config.Load()
	ctx := context.Background()
	pool, err := db.Connect(ctx, cfg.DB.DSN())
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	rows, err := pool.Query(ctx, `
		SELECT id, direction, body, created_at 
		FROM messages 
		ORDER BY created_at DESC 
		LIMIT 5
	`)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("--- Recent Messages ---")
	for rows.Next() {
		var id, direction, body, createdAt string
		rows.Scan(&id, &direction, &body, &createdAt)
		fmt.Printf("[%s] %s: %s (%s)\n", id[:8], direction, body, createdAt)
	}
}
