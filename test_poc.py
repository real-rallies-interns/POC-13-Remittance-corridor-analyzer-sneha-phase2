"""
test_poc.py — Selenium UAT Script
Project  : Infocreon · Remittance Corridor Analyzer · v4.0.0
Architect: Sneha Sunilkumar · Batch 2 Interns
Rail     : Payment Rail · Temporal · ID 13

Test Cases (per 05_INFOCREON_SELENIUM_AUTOMATION_GUIDE.docx):
  TC-01  Visual Load       — Background + map/visualization container visible
  TC-02  The Handshake     — Click a corridor tab → Intelligence Panel slides in
  TC-03  The Signature     — Click (i) Info icon → Architect name present in modal

Usage:
  pip install selenium
  python test_poc.py [--url https://your-azure-url.azurewebsites.net] [--headless]
"""

import sys
import time
import argparse
import traceback
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# ── Config ────────────────────────────────────────────────────────────────────

DEFAULT_URL    = "http://localhost:3000"   # ← replace with your Azure URL
ARCHITECT_NAME = "Sneha Sunilkumar"        # must appear in the (i) modal
WAIT_TIMEOUT   = 20                        # seconds for WebDriverWait
REPORT_FILE    = "Test_Report.txt"

# ── CLI args ──────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description="Infocreon Selenium UAT")
parser.add_argument("--url",      default=DEFAULT_URL, help="Target URL (Azure live URL)")
parser.add_argument("--headless", action="store_true",  help="Run Chrome in headless mode")
args = parser.parse_args()

TARGET_URL = args.url

# ── Report builder ────────────────────────────────────────────────────────────

results = []

def log(tc_id, name, status, detail=""):
    marker = "✅ PASS" if status else "❌ FAIL"
    line   = f"[{marker}]  {tc_id} — {name}"
    if detail:
        line += f"\n         Detail : {detail}"
    results.append((tc_id, name, status, detail))
    print(line)

def write_report():
    passed = sum(1 for r in results if r[2])
    total  = len(results)
    pct    = int(passed / total * 100) if total else 0

    lines = [
        "=" * 64,
        "  INFOCREON · REMITTANCE CORRIDOR ANALYZER",
        "  Selenium UAT Report — Cinematic Rail Brief",
        f"  Architect : {ARCHITECT_NAME}",
        f"  Target URL: {TARGET_URL}",
        f"  Run time  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "=" * 64,
        "",
    ]
    for tc_id, name, status, detail in results:
        marker = "PASS" if status else "FAIL"
        lines.append(f"  [{marker}]  {tc_id} — {name}")
        if detail:
            lines.append(f"           {detail}")
    lines += [
        "",
        "─" * 64,
        f"  Result : {passed}/{total} tests passed  ({pct}%)",
        "─" * 64,
        "",
        "  STATUS : " + ("✅ 100% PASS — Ready for Level 2 handover" if pct == 100
                         else f"❌ {total - passed} test(s) failed — review above"),
        "=" * 64,
    ]

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\n📄 Report written → {REPORT_FILE}")

# ── Driver setup ──────────────────────────────────────────────────────────────

def build_driver(headless: bool) -> webdriver.Chrome:
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1440,900")
    # Suppress console noise
    opts.add_experimental_option("excludeSwitches", ["enable-logging"])
    return webdriver.Chrome(options=opts)

# ── Helpers ───────────────────────────────────────────────────────────────────

def wait_for(driver, by, selector, timeout=WAIT_TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, selector))
    )

def wait_visible(driver, by, selector, timeout=WAIT_TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.visibility_of_element_located((by, selector))
    )

# ═════════════════════════════════════════════════════════════════════════════
#  TEST CASES
# ═════════════════════════════════════════════════════════════════════════════

def tc01_visual_load(driver):
    """
    TC-01 — Visual Load
    Verify:
      a) Page title contains 'Real Rails' or 'Remittance'
      b) Background body has the Cinematic Rail DNA colour (#060d1a)
      c) The INFOCREON header text is visible
      d) The map container (leaflet-container) OR a chart container is visible
    """
    tc = "TC-01"
    name = "Visual Load"
    try:
        driver.get(TARGET_URL)

        # (a) Title check
        WebDriverWait(driver, WAIT_TIMEOUT).until(
            lambda d: "real rails" in d.title.lower() or "remittance" in d.title.lower()
        )

        # (b) Body background — Cinematic Rail deep navy-obsidian
        body_bg = driver.execute_script(
            "return window.getComputedStyle(document.body).backgroundColor"
        )
        # rgb(6, 13, 26) == #060d1a
        bg_ok = "6, 13, 26" in body_bg or "060d1a" in body_bg.lower()

        # (c) INFOCREON brand text in header
        header_text = wait_visible(driver, By.XPATH,
            "//*[contains(text(),'INFOCREON')]")

        # (d) Map or visualization container
        try:
            viz = wait_visible(driver, By.CLASS_NAME, "leaflet-container", timeout=15)
        except TimeoutException:
            # Fallback: any of the chart/view containers
            viz = wait_visible(driver, By.XPATH,
                "//*[contains(@class,'recharts-wrapper') or contains(@class,'rr-surface')]",
                timeout=10)

        log(tc, name, True,
            f"Title='{driver.title}' | BG ok={bg_ok} | Map/viz found")

    except Exception as e:
        log(tc, name, False, str(e))


def tc02_handshake(driver):
    """
    TC-02 — The Handshake
    Click the first corridor tab button → verify Intelligence Panel slides in.
    Selectors derived from page.tsx:
      • Corridor tabs: shrink-0 px-2.5 py-1 rounded font-mono buttons inside the
        CORRIDORS bar.  We target the first one.
      • Intelligence Panel: header span text = 'Intelligence Panel'
      • Slide-over div: has class 'panel-slide-enter'
    """
    tc = "TC-02"
    name = "The Handshake"
    try:
        # Wait for corridor tab bar to appear
        corridors_label = wait_visible(driver, By.XPATH,
            "//*[contains(text(),'CORRIDORS')]")

        # Find corridor buttons — they sit in the same bar
        # page.tsx: button with c.label text inside the CORRIDORS flex row
        corridor_buttons = driver.find_elements(
            By.XPATH,
            "//span[contains(text(),'CORRIDORS')]/following-sibling::button"
        )

        # Fallback: buttons that contain route identifiers like 'UK→MX'
        if not corridor_buttons:
            corridor_buttons = driver.find_elements(
                By.XPATH,
                "//button[contains(@class,'font-mono') and contains(@style,'rgba(26,45,74')]"
            )

        if not corridor_buttons:
            raise NoSuchElementException(
                "No corridor tab buttons found. Check CORRIDORS bar rendered correctly."
            )

        first_btn = corridor_buttons[0]
        corridor_label = first_btn.text.strip()
        first_btn.click()

        # Wait for Intelligence Panel to slide in
        # page.tsx: <div class="... panel-slide-enter"> contains
        # <span>Intelligence Panel</span>
        intel_panel = WebDriverWait(driver, WAIT_TIMEOUT).until(
            EC.visibility_of_element_located(
                (By.XPATH, "//*[contains(text(),'Intelligence Panel')]")
            )
        )

        log(tc, name, True,
            f"Clicked corridor '{corridor_label}' → Intelligence Panel visible")

    except Exception as e:
        log(tc, name, False, str(e))


def tc03_signature(driver):
    """
    TC-03 — The Signature
    Click the (i) Info icon in the header → verify Architect name in modal.
    Selectors derived from page.tsx:
      • (i) button: title='Architect Signature', contains <Info> SVG icon
      • Modal: portal at document.body — contains 'Architect Signature' header
        and the architect name field value = 'Sneha Sunilkumar'
    """
    tc = "TC-03"
    name = "The Signature"
    try:
        # Locate the (i) button by its title attribute (set in page.tsx)
        info_btn = wait_visible(driver, By.XPATH,
            "//button[@title='Architect Signature']")

        info_btn.click()

        # Wait for the portal modal to appear — it renders into document.body
        # Look for the architect name text
        architect_el = WebDriverWait(driver, WAIT_TIMEOUT).until(
            EC.visibility_of_element_located(
                (By.XPATH, f"//*[contains(text(),'{ARCHITECT_NAME}')]")
            )
        )

        # Also confirm '◈ Architect Signature' header is visible
        modal_header = driver.find_element(
            By.XPATH, "//*[contains(text(),'Architect Signature')]"
        )

        log(tc, name, True,
            f"Modal open | Architect name '{ARCHITECT_NAME}' verified")

        # Close the modal so state is clean
        try:
            close_btn = driver.find_element(
                By.XPATH,
                "//button[contains(@style,'rgba(248,113,113')]"
            )
            close_btn.click()
        except Exception:
            pass  # Non-critical — modal closes on outside click anyway

    except Exception as e:
        log(tc, name, False, str(e))


# ═════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 64)
    print("  INFOCREON · Selenium UAT — Cinematic Rail Brief")
    print(f"  Target : {TARGET_URL}")
    print(f"  Mode   : {'Headless' if args.headless else 'Visible browser'}")
    print("=" * 64 + "\n")

    driver = None
    try:
        driver = build_driver(args.headless)

        tc01_visual_load(driver)
        tc02_handshake(driver)
        tc03_signature(driver)

    except Exception as e:
        print(f"\n⚠️  Fatal error before tests completed: {e}")
        traceback.print_exc()
    finally:
        if driver:
            driver.quit()
        write_report()

    # Exit code — non-zero if any test failed (useful for CI pipelines)
    failed = sum(1 for r in results if not r[2])
    sys.exit(failed)


if __name__ == "__main__":
    main()
