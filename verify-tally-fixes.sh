#!/bin/bash

# Tally Rendering Fixes Verification Script
# Verifies that the rendering fixes for 1000+ counts are in place

set -e

echo "🔍 Verifying Tally Rendering Fixes..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check 1: TallyMark.kt exists
echo -n "1. Checking TallyMark.kt exists... "
if [ -f "tally-android/core/design/src/main/java/com/tally/core/design/TallyMark.kt" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: 101-999 fix (9 blocks limit)
echo -n "2. Checking 101-999 range fix (9 blocks)... "
if grep -q "coerceAtMost(9)" tally-android/core/design/src/main/java/com/tally/core/design/TallyMark.kt && \
   grep -q "Allow up to 9 blocks" tally-android/core/design/src/main/java/com/tally/core/design/TallyMark.kt; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 3: 1001-9999 fix (9 rows limit)
echo -n "3. Checking 1001-9999 range fix (9 rows)... "
if grep -q "Allow up to 9 rows" tally-android/core/design/src/main/java/com/tally/core/design/TallyMark.kt && \
   grep -q "h \* 0.2f" tally-android/core/design/src/main/java/com/tally/core/design/TallyMark.kt; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: 10000+ diagonal fix
echo -n "4. Checking 10000+ diagonal closure fix... "
if grep -q "count >= 10000" tally-android/core/design/src/main/java/com/tally/core/design/TallyMark.kt; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Preview functions added
echo -n "5. Checking preview functions for 1000+... "
if grep -q "TallyMark1000Preview" tally-android/core/design/src/main/java/com/tally/core/design/TallyMark.kt && \
   grep -q "TallyMark10000Preview" tally-android/core/design/src/main/java/com/tally/core/design/TallyMark.kt; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: ChallengeCard.kt exists
echo -n "6. Checking ChallengeCard.kt exists... "
if [ -f "tally-android/app/src/main/java/com/tally/app/ui/ChallengeCard.kt" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 7: Dynamic sizing in ChallengeCard
echo -n "7. Checking ChallengeCard dynamic sizing... "
if grep -q "val tallySize = when" tally-android/app/src/main/java/com/tally/app/ui/ChallengeCard.kt && \
   grep -q ">= 1000 -> 72.dp" tally-android/app/src/main/java/com/tally/app/ui/ChallengeCard.kt && \
   grep -q ">= 100 -> 64.dp" tally-android/app/src/main/java/com/tally/app/ui/ChallengeCard.kt; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 8: Documentation exists
echo -n "8. Checking documentation... "
if [ -f "TALLY_RENDERING_REVIEW.md" ] || [ -f "tally-android/TALLY_RENDERING_FIXES.md" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} (optional)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Open TallyMark.kt in Android Studio"
    echo "  2. View the Preview pane to see 1000+, 5000+, 10000+ previews"
    echo "  3. Build and run: ./gradlew :app:assembleDebug"
    echo "  4. Test with a challenge that has 1000+ entries"
    exit 0
else
    echo -e "${RED}✗ $ERRORS check(s) failed${NC}"
    echo ""
    echo "Please review TALLY_RENDERING_REVIEW.md for implementation details."
    exit 1
fi
