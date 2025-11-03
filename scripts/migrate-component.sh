#!/bin/bash

# Component Migration Script
# Helps automate component migration process

COMPONENT_NAME=$1
OLD_PATH=$2
NEW_PATH=$3

if [ -z "$COMPONENT_NAME" ] || [ -z "$OLD_PATH" ] || [ -z "$NEW_PATH" ]; then
  echo "Usage: ./migrate-component.sh <component-name> <old-path> <new-path>"
  echo "Example: ./migrate-component.sh Button src/components/ui/button.tsx src/components/ui/button-new.tsx"
  exit 1
fi

echo "Migrating component: $COMPONENT_NAME"
echo "From: $OLD_PATH"
echo "To: $NEW_PATH"

# Create backup
echo "Creating backup..."
cp "$OLD_PATH" "${OLD_PATH}.backup"

# Find all usages
echo "Finding component usages..."
grep -r "from.*$COMPONENT_NAME" src/ --include="*.tsx" --include="*.ts" | head -20

echo ""
echo "Migration checklist:"
echo "1. Review new component implementation"
echo "2. Update imports in all files"
echo "3. Test functionality"
echo "4. Check accessibility"
echo "5. Verify mobile responsiveness"
echo "6. Update documentation"
echo "7. Mark as complete in migration tracker"
echo ""
echo "To rollback: cp ${OLD_PATH}.backup $OLD_PATH"

