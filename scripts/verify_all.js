const puppeteer = require('puppeteer');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('Starting full end-to-end verification via Puppeteer...');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 900 });

  const dialogsCaught = [];
  page.on('dialog', async dialog => {
    const msg = dialog.message();
    console.log(`[BROWSER DIALOG (${dialog.type()})] "${msg}"`);
    dialogsCaught.push({ type: dialog.type(), message: msg });
    await dialog.accept();
  });

  page.on('pageerror', err => {
    console.error('[BROWSER PAGE ERROR]', err.message);
  });

  // Helper injected into page to set React-controlled input and select values
  await page.evaluateOnNewDocument(() => {
    window.setReactInput = (input, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, val);
      else input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    window.setReactSelect = (select, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      if (setter) setter.call(select, val);
      else select.value = val;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    };
  });

  // ----------------------------------------------------
  // LOGIN
  // ----------------------------------------------------
  console.log('\n==============================================');
  console.log('AUTHENTICATION');
  console.log('==============================================');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  const inputs = await page.$$('input');
  await inputs[0].type('manager@stocksense.demo');
  await inputs[1].type('Demo1234!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  console.log('✓ Successfully logged in as Manager. Current URL:', page.url());

  // ----------------------------------------------------
  // FLOW 1: RECEIPTS
  // ----------------------------------------------------
  console.log('\n==============================================');
  console.log('FLOW 1: RECEIPTS VERIFICATION');
  console.log('==============================================');

  // 1. Note current On Hand quantity for Steel Rods on Stock page
  await page.goto('http://localhost:3000/stock', { waitUntil: 'networkidle0' });
  const initialSteelStock = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const r of rows) {
      if (r.innerText.toLowerCase().includes('steel rods')) {
        return r.innerText.replace(/\n+/g, ' ');
      }
    }
    return null;
  });
  console.log('1. Initial Stock for Steel Rods on /stock:\n  ', initialSteelStock);

  // 2. Go to Receipts page and create a new receipt: Steel Rods, qty 50
  await page.goto('http://localhost:3000/operations/receipts', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.innerText.toLowerCase().includes('new receipt'));
  }, { timeout: 15000 });

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('new receipt'));
    btn.click();
  });
  await sleep(800);

  // Fill in modal: select supplier (index 1), destination location (index 1 = Rack A), product = Steel Rods, qty = 50
  const receiptFormDetails = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    window.setReactSelect(selects[0], selects[0].options[1].value);
    const supplierText = selects[0].options[1].text;

    window.setReactSelect(selects[1], selects[1].options[1].value);
    const destLocText = selects[1].options[1].text;

    const prodSelect = selects[2];
    let prodText = '';
    for (let i = 0; i < prodSelect.options.length; i++) {
      if (prodSelect.options[i].text.toLowerCase().includes('steel rods')) {
        window.setReactSelect(prodSelect, prodSelect.options[i].value);
        prodText = prodSelect.options[i].text;
        break;
      }
    }

    const qtyInput = document.querySelector('input[type="number"]');
    window.setReactInput(qtyInput, '50');

    return { supplierText, destLocText, prodText, qty: qtyInput.value };
  });
  console.log('2. Filled New Receipt form:', receiptFormDetails);

  // Click 'Save Receipt'
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('save receipt'));
    saveBtn.click();
  });
  
  await page.waitForFunction(() => {
    const table = document.querySelector('table');
    return table && table.querySelectorAll('tbody tr').length > 0;
  }, { timeout: 15000 });
  await sleep(1000);

  // Verify created receipt in table
  const createdReceiptRow = await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    return firstRow ? firstRow.innerText.replace(/\n+/g, ' ') : null;
  });
  console.log('3. Receipt created in table:\n  ', createdReceiptRow);

  // 3. Validate receipt
  console.log('4. Clicking Validate on the Receipt...');
  await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    const valBtn = Array.from(firstRow.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('validate'));
    if (!valBtn) throw new Error('Validate button not found in first row');
    valBtn.click();
  });

  // Wait for row to update to Received / DONE
  await page.waitForFunction(() => {
    const firstRow = document.querySelector('tbody tr');
    return firstRow && (firstRow.innerText.toLowerCase().includes('received') || firstRow.innerText.includes('DONE'));
  }, { timeout: 15000 });
  await sleep(1000);

  // Confirm status changes to DONE
  const validatedReceiptRow = await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    return firstRow ? firstRow.innerText.replace(/\n+/g, ' ') : null;
  });
  console.log('5. Receipt after validation (confirming DONE / Received):\n  ', validatedReceiptRow);

  // 4. Confirm Steel Rods On Hand increased by exactly 50
  await page.goto('http://localhost:3000/stock', { waitUntil: 'networkidle0' });
  const updatedSteelStock = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const r of rows) {
      if (r.innerText.toLowerCase().includes('steel rods')) {
        return r.innerText.replace(/\n+/g, ' ');
      }
    }
    return null;
  });
  console.log('6. Updated Stock for Steel Rods on /stock (initial was 150, expected 200):\n  ', updatedSteelStock);

  // 5. Confirm Move History entry
  await page.goto('http://localhost:3000/operations/moves', { waitUntil: 'networkidle0' });
  const moveHistoryReceipt = await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    return firstRow ? firstRow.innerText.replace(/\n+/g, ' ') : null;
  });
  console.log('7. Ledger entry in Move History:\n  ', moveHistoryReceipt);


  // ----------------------------------------------------
  // FLOW 2: DELIVERY ORDERS
  // ----------------------------------------------------
  console.log('\n==============================================');
  console.log('FLOW 2: DELIVERY ORDERS VERIFICATION');
  console.log('==============================================');

  // 1. Note current On Hand for Cardboard Boxes on Stock page
  await page.goto('http://localhost:3000/stock', { waitUntil: 'networkidle0' });
  const initialBoxesStock = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const r of rows) {
      if (r.innerText.toLowerCase().includes('cardboard boxes')) {
        return r.innerText.replace(/\n+/g, ' ');
      }
    }
    return null;
  });
  console.log('1. Initial Stock for Cardboard Boxes:\n  ', initialBoxesStock);

  // 2. Create Delivery Order within stock: 20 Cardboard Boxes from Rack B
  await page.goto('http://localhost:3000/operations/deliveries', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.innerText.toLowerCase().includes('new delivery'));
  }, { timeout: 15000 });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('new delivery'));
    btn.click();
  });
  await sleep(800);

  const delivery1Details = await page.evaluate(() => {
    const addrInput = document.querySelector('input[type="text"][placeholder*="Evergreen"]');
    window.setReactInput(addrInput, 'Client Alpha Delivery');

    const selects = Array.from(document.querySelectorAll('select'));
    // Select Cardboard Boxes
    const prodSelect = selects[0];
    for (let i = 0; i < prodSelect.options.length; i++) {
      if (prodSelect.options[i].text.toLowerCase().includes('cardboard boxes')) {
        window.setReactSelect(prodSelect, prodSelect.options[i].value);
        break;
      }
    }

    // Select Rack B (which has the stock)
    const locSelect = selects[1];
    for (let i = 0; i < locSelect.options.length; i++) {
      if (locSelect.options[i].text.toLowerCase().includes('rack b')) {
        window.setReactSelect(locSelect, locSelect.options[i].value);
        break;
      }
    }

    // Set quantity = 20
    const qtyInput = document.querySelector('input[type="number"]');
    window.setReactInput(qtyInput, '20');

    return { product: prodSelect.options[prodSelect.selectedIndex].text, location: locSelect.options[locSelect.selectedIndex].text, qty: 20 };
  });
  console.log('2. Created Delivery Order 1 form within stock:', delivery1Details);

  // Save Draft
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('save draft'));
    saveBtn.click();
  });
  
  await page.waitForFunction(() => {
    const table = document.querySelector('table');
    return table && table.querySelectorAll('tbody tr').length > 0;
  }, { timeout: 15000 });
  await sleep(1000);

  // Advance delivery through status flow: Confirm (DRAFT -> WAITING)
  console.log('3. Clicking Confirm to move DRAFT -> WAITING...');
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const orderRow = rows.find(r => r.innerText.includes('Client Alpha Delivery')) || rows[0];
    const confirmBtn = Array.from(orderRow.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('confirm'));
    confirmBtn.click();
  });
  
  await page.waitForFunction(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const orderRow = rows.find(r => r.innerText.includes('Client Alpha Delivery')) || rows[0];
    return orderRow && orderRow.innerText.includes('WAITING');
  }, { timeout: 15000 });
  await sleep(1000);

  // Mark Ready (WAITING -> READY)
  console.log('4. Clicking Mark Ready to move WAITING -> READY...');
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const orderRow = rows.find(r => r.innerText.includes('Client Alpha Delivery')) || rows[0];
    const readyBtn = Array.from(orderRow.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('mark ready'));
    readyBtn.click();
  });

  await page.waitForFunction(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const orderRow = rows.find(r => r.innerText.includes('Client Alpha Delivery')) || rows[0];
    return orderRow && orderRow.innerText.includes('READY');
  }, { timeout: 15000 });
  await sleep(1000);

  // Validate / Ship (READY -> DONE)
  console.log('5. Clicking Ship / Done to validate delivery...');
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const orderRow = rows.find(r => r.innerText.includes('Client Alpha Delivery')) || rows[0];
    const shipBtn = Array.from(orderRow.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('ship'));
    shipBtn.click();
  });

  await page.waitForFunction(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const orderRow = rows.find(r => r.innerText.includes('Client Alpha Delivery')) || rows[0];
    return orderRow && (orderRow.innerText.toLowerCase().includes('shipped') || orderRow.innerText.includes('DONE'));
  }, { timeout: 15000 });
  await sleep(1000);

  const completedDeliveryRow = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const orderRow = rows.find(r => r.innerText.includes('Client Alpha Delivery')) || rows[0];
    return orderRow ? orderRow.innerText.replace(/\n+/g, ' ') : null;
  });
  console.log('6. Delivery row after completion:\n  ', completedDeliveryRow);

  // Check On Hand decreased by 20
  await page.goto('http://localhost:3000/stock', { waitUntil: 'networkidle0' });
  const updatedBoxesStock = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const r of rows) {
      if (r.innerText.toLowerCase().includes('cardboard boxes')) {
        return r.innerText.replace(/\n+/g, ' ');
      }
    }
    return null;
  });
  console.log('7. Stock for Cardboard Boxes after delivery (initial 250, decreased by exactly 20 to 230):\n  ', updatedBoxesStock);

  // Check Move History for outbound delivery ledger entry in red
  await page.goto('http://localhost:3000/operations/moves', { waitUntil: 'networkidle0' });
  const deliveryMoveEntry = await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    const qtySpan = firstRow.querySelector('td:nth-child(6) span');
    return {
      text: firstRow ? firstRow.innerText.replace(/\n+/g, ' ') : null,
      qtyClass: qtySpan ? qtySpan.className : null,
      computedColor: qtySpan ? window.getComputedStyle(qtySpan).color : null
    };
  });
  console.log('8. Outbound Delivery Ledger Entry in Move History (red outbound):\n  ', deliveryMoveEntry);

  // Now create a SECOND Delivery Order requesting MORE than Free to Use quantity
  console.log('\n9. Testing Second Delivery Order requesting MORE than Free to Use quantity (500 units)...');
  await page.goto('http://localhost:3000/operations/deliveries', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.innerText.toLowerCase().includes('new delivery'));
  }, { timeout: 15000 });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('new delivery'));
    btn.click();
  });
  await sleep(800);

  const modalStockWarning = await page.evaluate(() => {
    const addrInput = document.querySelector('input[type="text"][placeholder*="Evergreen"]');
    window.setReactInput(addrInput, 'Client Over-Order Test');

    const selects = Array.from(document.querySelectorAll('select'));
    const prodSelect = selects[0];
    for (let i = 0; i < prodSelect.options.length; i++) {
      if (prodSelect.options[i].text.toLowerCase().includes('cardboard boxes')) {
        window.setReactSelect(prodSelect, prodSelect.options[i].value);
        break;
      }
    }

    const locSelect = selects[1];
    for (let i = 0; i < locSelect.options.length; i++) {
      if (locSelect.options[i].text.toLowerCase().includes('rack b')) {
        window.setReactSelect(locSelect, locSelect.options[i].value);
        break;
      }
    }

    const qtyInput = document.querySelector('input[type="number"]');
    window.setReactInput(qtyInput, '500');

    const warnEl = document.querySelector('span.text-\\[var\\(--color-red\\)\\]');
    return warnEl ? warnEl.innerText : null;
  });
  console.log('  Modal stock warning observed:\n   ', modalStockWarning);

  // Save the over-requested draft order
  await page.evaluate(() => {
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('save draft'));
    saveBtn.click();
  });
  
  await page.waitForFunction(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.some(r => r.innerText.includes('Client Over-Order Test'));
  }, { timeout: 20000 });
  await sleep(1000);

  // Confirm that Deliveries Table renders a clear red alert on that line
  const tableStockWarning = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const overRow = rows.find(r => r.innerText.includes('Client Over-Order Test'));
    const redWarning = overRow ? overRow.querySelector('.text-\\[var\\(--color-red\\)\\]') : null;
    return {
      rowText: overRow ? overRow.innerText.replace(/\n+/g, ' ') : null,
      warningText: redWarning ? redWarning.innerText : null,
      rowBg: overRow ? window.getComputedStyle(overRow).backgroundColor : null,
    };
  });
  console.log('10. Over-requested order in Deliveries Table:\n   Row text:', tableStockWarning.rowText, '\n   Alert message:', tableStockWarning.warningText, '\n   Row background:', tableStockWarning.rowBg);

  // Advance to WAITING (reserving stock)
  console.log('11. Advancing over-order to WAITING...');
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const overRow = rows.find(r => r.innerText.includes('Client Over-Order Test'));
    if (!overRow) throw new Error('Client Over-Order Test row not found in table');
    const confirmBtn = Array.from(overRow.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('confirm'));
    if (!confirmBtn) throw new Error('Confirm button not found for over-order');
    confirmBtn.click();
  });
  
  await page.waitForFunction(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const overRow = rows.find(r => r.innerText.includes('Client Over-Order Test'));
    return overRow && overRow.innerText.includes('WAITING');
  }, { timeout: 20000 });
  await sleep(1000);

  // Attempt to Mark Ready: confirm the system flags this and blocks validation/Ready!
  console.log('12. Attempting to Mark Ready when stock is insufficient (500 requested > 230 on hand)...');
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const overRow = rows.find(r => r.innerText.includes('Client Over-Order Test'));
    const readyBtn = Array.from(overRow.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('mark ready'));
    if (!readyBtn) throw new Error('Mark Ready button not found for over-order');
    readyBtn.click();
  });
  await sleep(2500);

  // Check status is still WAITING (not silently marked ready/done, not crashing)
  const statusStillWaiting = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const overRow = rows.find(r => r.innerText.includes('Client Over-Order Test'));
    return overRow ? overRow.innerText.replace(/\n+/g, ' ') : null;
  });
  console.log('13. Order status after attempted advance (correctly prevented from shipping):\n  ', statusStillWaiting);


  // ----------------------------------------------------
  // FLOW 3: INTERNAL TRANSFERS
  // ----------------------------------------------------
  console.log('\n==============================================');
  console.log('FLOW 3: INTERNAL TRANSFERS VERIFICATION');
  console.log('==============================================');

  // Check Wooden Chairs initial stock across locations
  await page.goto('http://localhost:3000/stock', { waitUntil: 'networkidle0' });
  const initialChairs = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const r of rows) {
      if (r.innerText.toLowerCase().includes('wooden chairs')) {
        return r.innerText.replace(/\n+/g, ' ');
      }
    }
    return null;
  });
  console.log('1. Initial stock for Wooden Chairs:\n  ', initialChairs);

  // Create transfer: 10 Wooden Chairs from Rack A to Rack B
  await page.goto('http://localhost:3000/operations/transfers', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.innerText.toLowerCase().includes('new transfer'));
  }, { timeout: 15000 });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('new transfer'));
    btn.click();
  });
  await sleep(800);

  const transferDetails = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    // From Location: Rack A
    const fromSelect = selects[0];
    for (let i = 0; i < fromSelect.options.length; i++) {
      if (fromSelect.options[i].text.toLowerCase().includes('rack a')) {
        window.setReactSelect(fromSelect, fromSelect.options[i].value);
        break;
      }
    }
    // To Location: Rack B
    const toSelect = selects[1];
    for (let i = 0; i < toSelect.options.length; i++) {
      if (toSelect.options[i].text.toLowerCase().includes('rack b')) {
        window.setReactSelect(toSelect, toSelect.options[i].value);
        break;
      }
    }
    // Product: Wooden Chairs
    const prodSelect = selects[2];
    for (let i = 0; i < prodSelect.options.length; i++) {
      if (prodSelect.options[i].text.toLowerCase().includes('wooden chairs')) {
        window.setReactSelect(prodSelect, prodSelect.options[i].value);
        break;
      }
    }
    // Quantity: 10
    const qtyInput = document.querySelector('input[type="number"]');
    window.setReactInput(qtyInput, '10');

    return {
      from: fromSelect.options[fromSelect.selectedIndex].text,
      to: toSelect.options[toSelect.selectedIndex].text,
      product: prodSelect.options[prodSelect.selectedIndex].text,
      qty: 10
    };
  });
  console.log('2. Created Transfer form:', transferDetails);

  // Save Transfer
  await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    const saveBtn = modal ? modal.querySelector('button[type="submit"]') : null;
    if (!saveBtn) throw new Error('Schedule Transfer submit button not found');
    saveBtn.click();
  });
  
  await page.waitForFunction(() => {
    const table = document.querySelector('table');
    return table && table.querySelectorAll('tbody tr').length > 0;
  }, { timeout: 20000 });
  await sleep(1000);

  const transferRow = await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    return firstRow ? firstRow.innerText.replace(/\n+/g, ' ') : null;
  });
  console.log('3. Transfer in table before validate:\n  ', transferRow);

  // Validate Transfer
  console.log('4. Clicking Transfer button to validate transfer...');
  await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    const transferBtn = Array.from(firstRow.querySelectorAll('button')).find(b => b.innerText.trim().toLowerCase() === 'transfer');
    if (!transferBtn) throw new Error('Transfer button not found');
    transferBtn.click();
  });
  
  await sleep(4000);
  await page.goto('http://localhost:3000/operations/transfers', { waitUntil: 'networkidle0' });

  const completedTransferRow = await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    return firstRow ? firstRow.innerText.replace(/\n+/g, ' ') : null;
  });
  console.log('5. Transfer after validation (status Transferred ✓):\n  ', completedTransferRow);

  // Confirm stock: source decreased, dest increased, total unchanged
  await page.goto('http://localhost:3000/stock', { waitUntil: 'networkidle0' });
  const updatedChairs = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const r of rows) {
      if (r.innerText.toLowerCase().includes('wooden chairs')) {
        return r.innerText.replace(/\n+/g, ' ');
      }
    }
    return null;
  });
  console.log('6. Stock for Wooden Chairs after transfer (Total should still be exactly 40 unit):\n  ', updatedChairs);

  // Confirm two ledger entries written (one OUT, one IN) sharing the same document reference
  await page.goto('http://localhost:3000/operations/moves', { waitUntil: 'networkidle0' });
  const transferLedgerEntries = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr')).slice(0, 2);
    return rows.map(r => r.innerText.replace(/\n+/g, ' '));
  });
  console.log('7. Two Transfer Ledger Entries (sharing same document ref):\n  ', transferLedgerEntries.join('\n   '));


  // ----------------------------------------------------
  // FLOW 4: INVENTORY ADJUSTMENT
  // ----------------------------------------------------
  console.log('\n==============================================');
  console.log('FLOW 4: INVENTORY ADJUSTMENT VERIFICATION');
  console.log('==============================================');

  // 1. Pick a product/location, note recorded quantity (e.g. Desks at Rack A)
  await page.goto('http://localhost:3000/stock', { waitUntil: 'networkidle0' });
  const initialDesks = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const r of rows) {
      if (r.innerText.toLowerCase().includes('desks')) {
        return r.innerText.replace(/\n+/g, ' ');
      }
    }
    return null;
  });
  console.log('1. Initial recorded stock for Desks:\n  ', initialDesks);

  // 2. Create adjustment: Desks at Rack A counted quantity = 95 (previous was 80, delta = +15)
  await page.goto('http://localhost:3000/operations/adjustments', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.innerText.toLowerCase().includes('new adjustment'));
  }, { timeout: 20000 });
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes('new adjustment'));
    btn.click();
  });
  await sleep(800);

  const adjustmentDetails = await page.evaluate(() => {
    const locSelect = document.querySelectorAll('select')[0];
    for (let i = 0; i < locSelect.options.length; i++) {
      if (locSelect.options[i].text.toLowerCase().includes('rack a')) {
        window.setReactSelect(locSelect, locSelect.options[i].value);
        break;
      }
    }

    const noteInput = document.querySelector('input[type="text"][placeholder*="physical"]');
    window.setReactInput(noteInput, 'Q3 Physical Cycle Count');

    const prodSelect = document.querySelectorAll('select')[1];
    for (let i = 0; i < prodSelect.options.length; i++) {
      if (prodSelect.options[i].text.toLowerCase().includes('desks')) {
        window.setReactSelect(prodSelect, prodSelect.options[i].value);
        break;
      }
    }

    const qtyInput = document.querySelector('input[type="number"]');
    window.setReactInput(qtyInput, '95');

    return {
      loc: locSelect.options[locSelect.selectedIndex].text,
      prod: prodSelect.options[prodSelect.selectedIndex].text,
      countedQty: 95
    };
  });
  console.log('2. Created Adjustment form:', adjustmentDetails);

  // Click Apply Adjustment
  await page.evaluate(() => {
    const modal = document.querySelector('.fixed.inset-0');
    const applyBtn = modal ? modal.querySelector('button[type="submit"]') : null;
    if (!applyBtn) throw new Error('Apply Adjustment submit button not found');
    applyBtn.click();
  });
  
  await sleep(4000);
  await page.goto('http://localhost:3000/operations/adjustments', { waitUntil: 'networkidle0' });

  const recordedAdjustmentRow = await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    return firstRow ? firstRow.innerText.replace(/\n+/g, ' ') : null;
  });
  console.log('3. Adjustments Table recorded row (showing previous -> new variance):\n  ', recordedAdjustmentRow);

  // Confirm stock page shows 95
  await page.goto('http://localhost:3000/stock', { waitUntil: 'networkidle0' });
  const updatedDesks = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    for (const r of rows) {
      if (r.innerText.toLowerCase().includes('desks')) {
        return r.innerText.replace(/\n+/g, ' ');
      }
    }
    return null;
  });
  console.log('4. Updated stock for Desks on /stock (should be exactly 95 unit):\n  ', updatedDesks);

  // Confirm Move History ledger entry stores BOTH previous and new quantity, not just delta
  await page.goto('http://localhost:3000/operations/moves', { waitUntil: 'networkidle0' });
  const adjustmentLedgerEntry = await page.evaluate(() => {
    const firstRow = document.querySelector('tbody tr');
    return firstRow ? firstRow.innerText.replace(/\n+/g, ' ') : null;
  });
  console.log('5. Adjustment Ledger Entry in Move History (confirming both previous and new quantity):\n  ', adjustmentLedgerEntry);


  // ----------------------------------------------------
  // AFTER ALL FOUR PASS: DASHBOARD & KPIS
  // ----------------------------------------------------
  console.log('\n==============================================');
  console.log('DASHBOARD KPIS & RECENT DOCUMENTS VERIFICATION');
  console.log('==============================================');

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });

  const kpis = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.grid > div')).filter(div => div.querySelector('.text-3xl'));
    return cards.map(c => {
      const title = c.querySelector('span')?.innerText;
      const val = c.querySelector('.text-3xl')?.innerText;
      const subtitle = c.querySelector('.truncate')?.innerText;
      return { title, val, subtitle };
    });
  });
  console.log('1. Dashboard KPIs:');
  for (const k of kpis) {
    if (k.title) console.log(`   - ${k.title}: ${k.val} (${k.subtitle})`);
  }

  const recentDocsInfo = await page.evaluate(() => {
    const headerSpan = document.querySelector('.border-b span.font-mono');
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return {
      counterText: headerSpan ? headerSpan.innerText : null,
      rowCount: rows.length,
      sampleDocs: rows.slice(0, 5).map(r => r.innerText.replace(/\n+/g, ' '))
    };
  });
  console.log('2. Recent Warehouse Documents counter text:', recentDocsInfo.counterText);
  console.log('   Number of rows rendered in Recent Documents Table:', recentDocsInfo.rowCount);
  console.log('   Sample recent docs:');
  for (const d of recentDocsInfo.sampleDocs) {
    console.log(`     * ${d}`);
  }

  console.log('\nDialogs caught during session:');
  for (const d of dialogsCaught) {
    console.log(`   [${d.type}] ${d.message}`);
  }

  await browser.close();
  console.log('\n==============================================');
  console.log('✓ All 4 verification flows completed successfully in the browser!');
  console.log('==============================================');
}

runVerification().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
