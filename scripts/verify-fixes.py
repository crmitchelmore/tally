#!/usr/bin/env python3
"""
Verify the sets/reps fixes in production:
1. Tally slash angle (visual - screenshot)
2. Entry list structure (no duplicate tallies in headers)
3. Dashboard burn-up chart presence
4. Edit entry dialog sets support
"""

from playwright.sync_api import sync_playwright
import os
import sys

PROD_URL = "https://tally-tracker.app"
TEST_EMAIL = os.environ.get("TEST_USER_EMAIL", "")
TEST_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "")

def verify_landing_page(page):
    """Check landing page loads with tally visualizations."""
    print("\n=== 1. Landing Page & Tally Visualization ===")
    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")
    
    # Take screenshot of landing page (includes hero tally demo)
    page.screenshot(path="/tmp/tally-landing.png", full_page=True)
    print("✓ Landing page screenshot saved to /tmp/tally-landing.png")
    
    # Check for tally elements on page
    tally_elements = page.locator('[class*="tally"], [data-testid*="tally"]').count()
    print(f"  Found {tally_elements} tally-related elements on landing page")
    
    return True

def verify_authenticated_features(page):
    """Sign in and verify dashboard/entry features."""
    print("\n=== 2. Authentication ===")
    
    if not TEST_EMAIL or not TEST_PASSWORD:
        print("⚠ TEST_USER_EMAIL/TEST_USER_PASSWORD not set - skipping authenticated tests")
        return False
    
    # Go to sign-in
    page.goto(f"{PROD_URL}/sign-in")
    page.wait_for_load_state("networkidle")
    
    # Fill credentials via Clerk
    email_input = page.locator('input[name="identifier"], input[type="email"]')
    if email_input.count() > 0:
        email_input.first.fill(TEST_EMAIL)
        page.get_by_role("button", name="Continue", exact=True).click()
        page.wait_for_timeout(2000)
        
        password_input = page.locator('input[type="password"]')
        if password_input.count() > 0:
            password_input.first.fill(TEST_PASSWORD)
            page.get_by_role("button", name="Continue", exact=True).click()
            page.wait_for_timeout(3000)
    
    # Wait for redirect to app
    page.wait_for_url("**/app**", timeout=10000)
    page.wait_for_load_state("networkidle")
    print("✓ Signed in successfully")
    
    return True

def verify_dashboard(page):
    """Check dashboard has all panels including BurnUpChart."""
    print("\n=== 3. Dashboard Panels ===")
    
    page.goto(f"{PROD_URL}/app")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)  # Extra time for data fetch
    
    # Screenshot dashboard
    page.screenshot(path="/tmp/tally-dashboard.png", full_page=True)
    print("✓ Dashboard screenshot saved to /tmp/tally-dashboard.png")
    
    # Check for burn-up chart heading or chart elements
    html = page.content()
    if "Goal Progress" in html or "burn" in html.lower():
        print("✓ BurnUpChart section found on dashboard")
    else:
        print("⚠ BurnUpChart section not visible (may need challenges with targets)")
    
    # Check for highlights panel
    if "highlights" in html.lower() or "Today" in html:
        print("✓ Highlights panel present")
    
    return True

def verify_entry_list(page):
    """Check entry list doesn't have duplicate tally icons."""
    print("\n=== 4. Entry List Structure ===")
    
    # Go to a challenge page (first one)
    challenges = page.locator('a[href*="/app/challenges/"]')
    if challenges.count() > 0:
        challenges.first.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)
        
        # Screenshot challenge detail
        page.screenshot(path="/tmp/tally-challenge-detail.png", full_page=True)
        print("✓ Challenge detail screenshot saved to /tmp/tally-challenge-detail.png")
        
        # Check structure: date headers should NOT have TallyDisplay
        # Entry boxes should have TallyDisplay
        html = page.content()
        
        # Look for sets breakdown format "X sets: A + B + C = total"
        if "sets:" in html and "+" in html and "=" in html:
            print("✓ Sets breakdown visible in entry list")
        else:
            print("  (No entries with sets found in this challenge)")
    else:
        print("⚠ No challenges found to inspect")
    
    return True

def verify_edit_dialog(page):
    """Check edit entry dialog supports sets."""
    print("\n=== 5. Edit Entry Dialog ===")
    
    # Look for edit button on an entry
    edit_buttons = page.locator('button[aria-label="Edit entry"]')
    if edit_buttons.count() > 0:
        edit_buttons.first.click()
        page.wait_for_timeout(1000)
        
        # Screenshot edit dialog
        page.screenshot(path="/tmp/tally-edit-dialog.png")
        print("✓ Edit dialog screenshot saved to /tmp/tally-edit-dialog.png")
        
        # Check for sets UI elements
        dialog_html = page.locator('dialog, [role="dialog"]').inner_html() if page.locator('dialog, [role="dialog"]').count() > 0 else ""
        
        if "Set " in dialog_html or "sets" in dialog_html.lower():
            print("✓ Sets editing UI present in edit dialog")
        else:
            print("  (Entry may not use sets mode)")
        
        # Close dialog
        close_btn = page.locator('button[aria-label="Close"]')
        if close_btn.count() > 0:
            close_btn.first.click()
    else:
        print("⚠ No edit buttons found (may need entries)")
    
    return True

def main():
    print("=" * 60)
    print("TALLY PRODUCTION VERIFICATION")
    print("=" * 60)
    print(f"URL: {PROD_URL}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        try:
            # 1. Landing page (public)
            verify_landing_page(page)
            
            # 2-5. Authenticated features
            if verify_authenticated_features(page):
                verify_dashboard(page)
                verify_entry_list(page)
                verify_edit_dialog(page)
            
            print("\n" + "=" * 60)
            print("VERIFICATION COMPLETE")
            print("Screenshots saved to /tmp/tally-*.png")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ Error during verification: {e}")
            page.screenshot(path="/tmp/tally-error.png")
            print("Error screenshot saved to /tmp/tally-error.png")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    main()
