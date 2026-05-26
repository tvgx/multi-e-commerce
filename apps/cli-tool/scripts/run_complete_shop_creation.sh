#!/bin/bash
# Complete Shop Creation & Verification Workflow
# Usage: ./scripts/run_complete_shop_creation.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
SHOP_NAME=${1:-"Test Fashion Shop"}
SHOP_DOMAIN=${2:-"test.localhost:3002"}
OWNER_EMAIL=${3:-"testowner@example.com"}
TEMPLATE=${4:-"fashion"}
API_BASE=${5:-"http://localhost:3000"}

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Complete Shop Creation & Verification Workflow${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Shop Name: $SHOP_NAME"
echo "  Domain:    $SHOP_DOMAIN"
echo "  Email:     $OWNER_EMAIL"
echo "  Template:  $TEMPLATE"
echo "  API Base:  $API_BASE"
echo ""

# Check PostgreSQL connectivity
echo -e "${BLUE}[1/4]${NC} Checking PostgreSQL connectivity..."
if ! pg_isready -h localhost -U admin -d shop_db_1 2>/dev/null; then
    echo -e "${RED}✗ PostgreSQL not accessible at localhost:5432${NC}"
    echo "  Please start Docker: docker compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL ready${NC}\n"

# Check MongoDB connectivity
echo -e "${BLUE}[2/4]${NC} Checking MongoDB connectivity..."
if ! mongosh --eval "db.adminCommand('ping')" --quiet 2>/dev/null; then
    echo -e "${RED}✗ MongoDB not accessible at localhost:27017${NC}"
    echo "  Please start Docker: docker compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ MongoDB ready${NC}\n"

# Check API Core connectivity
echo -e "${BLUE}[3/4]${NC} Checking API Core connectivity..."
if ! curl -s "$API_BASE/health" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Warning: API Core not responding to health check${NC}"
    echo "  Start with: cd apps/api-core && npm run dev"
    echo "  Continuing anyway (will verify later)...\n"
else
    echo -e "${GREEN}✓ API Core responding${NC}\n"
fi

# Create shop
echo -e "${BLUE}[4/4]${NC} Creating shop via CLI..."
echo ""

SHOP_CREATE_OUTPUT=$(python main.py shop create \
  --name "$SHOP_NAME" \
  --domain "$SHOP_DOMAIN" \
  --owner-email "$OWNER_EMAIL" \
  --template "$TEMPLATE" \
  --products-per-page 30 2>&1)

echo "$SHOP_CREATE_OUTPUT"

# Extract shop_id from output
SHOP_ID=$(echo "$SHOP_CREATE_OUTPUT" | grep -oP '(?<=shop_id: )[a-f0-9\-]+' | head -1)

if [ -z "$SHOP_ID" ]; then
    echo -e "${RED}✗ Failed to extract shop_id from CLI output${NC}"
    exit 1
fi

echo -e "\n${GREEN}✓ Shop created successfully!${NC}"
echo -e "  Shop ID: ${BLUE}$SHOP_ID${NC}\n"

# Seed mock data
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Seeding Mock Data${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

python scripts/seed_mock_shop.py --shop-id "$SHOP_ID"

# Run verification
echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Running Verification Tests${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"

python scripts/verify_shop_setup.py --shop-id "$SHOP_ID" --api-base "$API_BASE"

# Summary
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✨ Complete Shop Creation Workflow Finished! ✨${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}\n"

echo -e "📋 Next Steps:"
echo -e "  1. Verify Admin Dashboard:   http://localhost:3001"
echo -e "  2. Verify Storefront:        http://localhost:3002 "
echo -e "  3. Test APIs with shop_id:   $SHOP_ID\n"

echo -e "🛍️  Shop Details:"
echo -e "  Name:  $SHOP_NAME"
echo -e "  ID:    $SHOP_ID"
echo -e "  Email: $OWNER_EMAIL"
echo ""
