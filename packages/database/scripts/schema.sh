#!/bin/bash
# ==========================================
# Schema Management Commands
# ==========================================
# Convenience script for working with the modular Prisma schema

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Show help
show_help() {
    cat << 'EOF'
Schema Management Commands
==========================

Available commands:

  build               Build schema from models/
  watch               Watch models/ and auto-rebuild
  generate            Build + Generate Prisma Client
  migrate             Build + Create/run migrations
  studio              Build + Open Prisma Studio
  list                List all model files
  validate            Validate schema syntax
  diff                Show schema changes
  help                Show this help message

Examples:

  ./schema.sh build
  ./schema.sh watch                # Requires chokidar
  ./schema.sh generate
  ./schema.sh migrate
  ./schema.sh validate

Environment:

  Set DEBUG=1 for verbose output
EOF
}

# Check dependencies
check_deps() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found"
        return 1
    fi
    if ! command -v npx &> /dev/null; then
        print_error "npx not found"
        return 1
    fi
    return 0
}

# Build schema
build_schema() {
    print_header "Building Prisma Schema"
    cd "$DB_DIR"
    node scripts/build-prisma-schema.js
    print_success "Schema built successfully"
}

# Watch mode
watch_schema() {
    print_header "Watching Schema Files"
    cd "$DB_DIR"
    node scripts/build-prisma-schema.js --watch
}

# Generate client
generate_client() {
    print_header "Generating Prisma Client"
    cd "$DB_DIR"
    npm run prisma:generate
    print_success "Prisma Client generated"
}

# Run migrations
run_migrate() {
    print_header "Running Prisma Migrations"
    cd "$DB_DIR"
    npm run prisma:migrate
    print_success "Migration completed"
}

# Open studio
open_studio() {
    print_header "Opening Prisma Studio"
    cd "$DB_DIR"
    npm run prisma:studio
}

# List models
list_models() {
    print_header "Available Models"
    cd "$DB_DIR"
    ls -1 prisma/models/ | grep -E '\.prisma$' | while read file; do
        count=$(grep -c '^model ' "prisma/models/$file" || echo "0")
        printf "  %-20s %d models\n" "$file" "$count"
    done
}

# Validate schema
validate_schema() {
    print_header "Validating Schema"
    cd "$DB_DIR"
    
    if npx prisma validate 2>&1 | grep -q "valid"; then
        print_success "Schema is valid"
    else
        print_error "Schema validation failed"
        npx prisma validate
        return 1
    fi
}

# Show diff
show_diff() {
    print_header "Schema Changes"
    cd "$DB_DIR"
    git diff prisma/schema.prisma || print_info "No changes tracked in git"
}

# Main command handling
main() {
    check_deps || exit 1
    
    case "${1:-}" in
        build)
            build_schema
            ;;
        watch)
            watch_schema
            ;;
        generate)
            build_schema
            generate_client
            ;;
        migrate)
            build_schema
            run_migrate
            ;;
        studio)
            build_schema
            open_studio
            ;;
        list)
            list_models
            ;;
        validate)
            validate_schema
            ;;
        diff)
            show_diff
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "Unknown command: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
