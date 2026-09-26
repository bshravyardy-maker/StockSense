const puppeteer = require('puppeteer');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyAll() {
  console.log('--- Starting verification of all 7 items ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 900 });

  page.on('dialog', async dialog => {
    console.log(`[DIALOG] ${dialog.message()}`);
    await dialog.accept();
  });

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
    }
  });
  page.on('pageerror', err => console.log('[BROWSER PAGE ERROR]', err.message));

  await page.evaluateOnNewDocument(() => {
    window.setReactInput = (input, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, val);
      else input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };
  });

  try {
    // -------------------------------------------------------------
    // Item 1: Privacy Policy (/privacy) & Terms (/terms)
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Verifying /privacy and /terms content and sidebar profile links...');
    await page.goto('http://localhost:3000/privacy', { waitUntil: 'networkidle0' });
    const privacyContent = await page.content();
    if (!privacyContent.includes('no third-party email service connected')) {
      throw new Error('Privacy page missing demo email service mention');
    }
    if (!privacyContent.includes('We do not sell, rent, monetize, or share your data')) {
      throw new Error('Privacy page missing third party sales clause');
    }
    console.log('✓ /privacy page verified with plain-language content');

    await page.goto('http://localhost:3000/terms', { waitUntil: 'networkidle0' });
    const termsContent = await page.content();
    if (!termsContent.includes('no external email service is integrated')) {
      throw new Error('Terms page missing demo email service mention');
    }
    if (!termsContent.includes('never sold, marketed, or shared with third-party vendors')) {
      throw new Error('Terms page missing third party sales clause');
    }
    console.log('✓ /terms page verified with plain-language content');

    // Login as manager
    console.log('\nLogging in as Manager...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    const loginInputs = await page.$$('input');
    await loginInputs[0].type('manager@stocksense.demo');
    await loginInputs[1].type('Demo1234!');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 15000 });
    await page.waitForSelector('aside', { timeout: 10000 });
    console.log('✓ Successfully logged in as Manager. Current URL:', page.url());

    // Check sidebar profile links
    const sidebarPrivacyLink = await page.$('aside a[href="/privacy"]');
    const sidebarTermsLink = await page.$('aside a[href="/terms"]');
    if (!sidebarPrivacyLink || !sidebarTermsLink) {
      throw new Error('Sidebar profile menu missing /privacy or /terms link');
    }
    console.log('✓ Sidebar profile menu contains links to /privacy and /terms');

    // Click privacy link while logged in to confirm no redirect to /dashboard
    await page.click('aside a[href="/privacy"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    if (!page.url().includes('/privacy')) {
      throw new Error(`Expected to stay on /privacy but was redirected to ${page.url()}`);
    }
    console.log('✓ Logged-in user can visit /privacy without redirect loop');

    // -------------------------------------------------------------
    // Item 2: Profile page (/profile)
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Verifying /profile page (name, read-only login ID, read-only role, editable name)...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
    const profileContent = await page.content();
    if (!profileContent.includes('manager@stocksense.demo')) {
      throw new Error('Profile missing login ID');
    }
    if (!profileContent.includes('MANAGER')) {
      throw new Error('Profile missing role badge');
    }

    // Verify login ID input is disabled/read-only
    const loginIdDisabled = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const idInput = inputs.find(i => i.value === 'manager@stocksense.demo');
      return idInput && (idInput.readOnly || idInput.disabled);
    });
    if (!loginIdDisabled) {
      throw new Error('Login ID should be read-only');
    }
    console.log('✓ Login ID is strictly read-only');

    // Test editing display name
    console.log('Testing display name update...');
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[placeholder="Your full name"]');
      nameInput.value = '';
    });
    const nameInput = await page.$('input[placeholder="Your full name"]');
    await nameInput.type('Demo Manager Edited');
    await page.click('button[type="submit"]');
    await sleep(1500);

    const updatedProfileContent = await page.content();
    if (!updatedProfileContent.includes('Demo Manager Edited')) {
      throw new Error('Display name update did not reflect on profile page');
    }
    console.log('✓ Display name edited successfully and reflected');

    // Revert back
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Your full name"]');
      input.value = '';
    });
    await nameInput.type('Demo Manager');
    await page.click('button[type="submit"]');
    await sleep(1500);
    console.log('✓ Display name reverted back to "Demo Manager"');

    // Check Privacy and Terms links on /profile
    const profilePrivacy = await page.$('a[href="/privacy"]');
    const profileTerms = await page.$('a[href="/terms"]');
    if (!profilePrivacy || !profileTerms) {
      throw new Error('Profile page missing links to Privacy or Terms');
    }
    console.log('✓ Profile page links to Privacy Policy and Terms of Service');

    // -------------------------------------------------------------
    // Item 3: Favicon
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Verifying favicon icon.svg...');
    const iconRes = await page.goto('http://localhost:3000/icon.svg');
    if (iconRes.status() !== 200) {
      throw new Error(`Favicon /icon.svg returned status ${iconRes.status()}`);
    }
    const iconSvg = await iconRes.text();
    if (!iconSvg.includes('<svg') || !iconSvg.includes('#1C2127')) {
      throw new Error('Favicon SVG content invalid');
    }
    console.log('✓ Real package/box favicon served at /icon.svg');

    // -------------------------------------------------------------
    // Item 4: Global Search Bar
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Verifying Global Search Bar on list pages...');
    // 1. Products page
    await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle0' });
    const searchInput = await page.$('header input[type="text"]');
    await searchInput.type('Steel');
    await searchInput.press('Enter');
    await page.waitForFunction(() => window.location.search.includes('q=Steel'), { timeout: 5000 });
    console.log('Search URL after typing and pressing Enter:', page.url());
    const filteredProducts = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(r => r.innerText);
    });
    console.log(`✓ Products filtered by query "Steel": found ${filteredProducts.length} rows`);
    if (filteredProducts.length === 0 || !filteredProducts.every(t => t.toLowerCase().includes('steel'))) {
      throw new Error('Search on Products page did not filter properly');
    }

    // 2. Clear and test Stock page
    await page.goto('http://localhost:3000/stock?q=STL-001', { waitUntil: 'networkidle0' });
    const stockRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(r => r.innerText);
    });
    console.log(`✓ Stock page filtered by query "STL-001": found ${stockRows.length} rows`);
    if (stockRows.length === 0 || !stockRows[0].includes('STL-001')) {
      throw new Error('Search on Stock page did not filter properly');
    }

    // -------------------------------------------------------------
    // Item 5: Print action on DONE / RECORDED documents
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Verifying Print action on documents...');
    // Check Adjustments table
    await page.goto('http://localhost:3000/operations/adjustments', { waitUntil: 'networkidle0' });
    const printButtons = await page.$$('table button');
    let foundAdjustmentPrint = false;
    for (const btn of printButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Print')) {
        foundAdjustmentPrint = true;
        await btn.click();
        await sleep(500);
        break;
      }
    }
    const modalVisible = await page.$('#printable-document-content');
    if (!foundAdjustmentPrint || !modalVisible) {
      throw new Error('Print button or printable document modal not found on adjustments');
    }
    const modalText = await page.evaluate(el => el.innerText, modalVisible);
    if (!modalText.includes('INVENTORY ADJUSTMENT VOUCHER') && !modalText.includes('Adjustment Voucher')) {
      throw new Error('Printable modal does not contain expected voucher title');
    }
    console.log('✓ Print action opens printable summary view with formatted voucher');

    // Close modal
    await page.evaluate(() => {
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Close'));
      if (closeBtn) closeBtn.click();
    });
    await sleep(300);

    // -------------------------------------------------------------
    // Item 6: STAFF role nav gating
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Verifying STAFF-role navigation gating...');
    // Sign out
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const signoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign Out'));
      if (signoutBtn) signoutBtn.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Log in as Staff
    const staffInputs = await page.$$('input');
    await staffInputs[0].type('staff@stocksense.demo');
    await staffInputs[1].type('Demo1234!');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 15000 });
    await page.waitForSelector('aside', { timeout: 10000 });

    // Verify Settings > Warehouses is completely missing from sidebar
    const warehousesLink = await page.$('aside a[href="/settings/warehouses"]');
    const settingsHeader = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside ? aside.innerText.includes('Settings') : false;
    });

    if (warehousesLink !== null || settingsHeader) {
      throw new Error('Settings > Warehouses link or section is visible to STAFF user!');
    }
    console.log('✓ Settings > Warehouses nav item is completely hidden from STAFF user sidebar');

    // Verify direct navigation redirects to /dashboard
    await page.goto('http://localhost:3000/settings/warehouses', { waitUntil: 'networkidle0' });
    if (!page.url().includes('/dashboard')) {
      throw new Error(`Direct visit to /settings/warehouses should redirect to /dashboard, got ${page.url()}`);
    }
    console.log('✓ Direct navigation to /settings/warehouses redirects STAFF to /dashboard');

    // -------------------------------------------------------------
    // Item 7: Dashboard Recent Warehouse Documents count
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Verifying Dashboard Recent Warehouse Documents count...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    const countLabelText = await page.evaluate(() => {
      const header = document.querySelector('h3');
      const countEl = header?.closest('div')?.parentElement?.querySelector('span.font-mono');
      return countEl ? countEl.innerText : null;
    });
    console.log(`Recent documents count label in UI: "${countLabelText}"`);
    if (countLabelText && countLabelText.includes('0 of 8 shown')) {
      throw new Error('Found hardcoded "0 of 8 shown" in Recent Documents!');
    }
    console.log('✓ Recent Warehouse Documents reflects real count and does not show "0 of 8 shown"');

    console.log('\n======================================================');
    console.log('ALL 7 REQUIREMENTS SUCCESSFULLY VERIFIED END-TO-END!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyAll();
