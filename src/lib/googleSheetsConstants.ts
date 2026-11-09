/**
 * Ready-to-deploy Google Apps Script for the user's Google Sheet
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * ====================================================================
 * YT Tools Store - Real-time Google Sheet Auto-Sync & Backup Script
 * ====================================================================
 * 
 * STATUS COLOR RULES:
 * - completed  -> Green background (#16a34a), White bold text
 * - processing -> Dark Blue background (#1e3a8a), White bold text
 * - cancel     -> Red background (#dc2626), White bold text
 * - pending    -> Peach background (#FFDAB9), Dark contrast bold text (#431407)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet ("YT TOOLS STORE").
 * 2. In top menu, click: Extensions -> Apps Script.
 * 3. Delete any previous code in Code.gs, and PASTE this entire script.
 * 4. Click the "Save" icon (or Ctrl+S).
 * 5. Click "Deploy" (top right) -> "Manage deployments" -> Edit (pencil icon) -> Version: "New version" -> Deploy.
 *    (Or if first time: Deploy -> New deployment -> Web app -> Anyone -> Deploy).
 * 6. OPTIONAL (Instant color for all existing rows): Select "applyColorsToSheet" in the top function dropdown and click "Run".
 *    OR click "Test Sheet Connection" in your YT Tools Store Admin Settings!
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No POST body received"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeaders(sheet);

    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    // 1. Connection Test
    if (action === "test") {
      setupStatusConditionalFormatting(sheet);
      formatAllExistingRows(sheet);
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Connected successfully to Google Sheet: "' + sheet.getName() + '" (Status colors applied!)'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Single Order Sync (Insert if new, Update in-place if existing)
    if (action === "sync_order" && data.order) {
      syncSingleOrder(sheet, data.order);
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        orderId: data.order.id
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Batch Sync (All existing orders)
    if (action === "batch_sync" && data.orders && Array.isArray(data.orders)) {
      for (var i = 0; i < data.orders.length; i++) {
        syncSingleOrder(sheet, data.orders[i]);
      }
      setupStatusConditionalFormatting(sheet);
      formatAllExistingRows(sheet);
      SpreadsheetApp.flush();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        syncedCount: data.orders.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Delete / Cancel Order
    if (action === "delete_order" && data.orderId) {
      var row = findRowByOrderId(sheet, data.orderId);
      if (row > 1) {
        var cell = sheet.getRange(row, 9);
        cell.setValue("cancelled / deleted");
        formatStatusCell(cell, "cancelled");
        SpreadsheetApp.flush();
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        orderId: data.orderId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Unknown action: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureHeaders(sheet) {
  var headers = [
    "Date",
    "ORDER ID#",
    "PRODUCT",
    "COST PRICE",
    "SELL PRICE",
    "PROFIT",
    "Customer name",
    "phone number",
    "order status",
    "vendor name",
    "vendor payment status"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    formatHeaderRow(sheet);
  } else {
    var firstVal = sheet.getRange(1, 1).getValue();
    if (!firstVal || String(firstVal).trim() === "") {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(sheet);
    }
  }

  setupStatusConditionalFormatting(sheet);
}

function formatHeaderRow(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, 11);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#111827"); // Modern dark slate
  headerRange.setFontColor("#FFFFFF");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function findRowByOrderId(sheet, orderId) {
  if (!orderId) return -1;
  var target = String(orderId).trim().toLowerCase();
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  var colBValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (var i = 0; i < colBValues.length; i++) {
    var val = String(colBValues[i][0]).trim().toLowerCase();
    if (val === target || val.replace('#', '') === target.replace('#', '')) {
      return i + 2; // Range starts at row 2
    }
  }
  return -1;
}

function syncSingleOrder(sheet, order) {
  var targetRow = findRowByOrderId(sheet, order.id);
  var isNew = targetRow === -1;
  var rowNum = isNew ? sheet.getLastRow() + 1 : targetRow;

  // Live Google Sheet formula for Column 6 (PROFIT): =Sell Price - Cost Price (Col E - Col D)
  var formula = '=IF(ISNUMBER(E' + rowNum + '), E' + rowNum + '-N(D' + rowNum + '), "")';

  var rowValues = [
    order.date || "",
    order.id || "",
    order.product || "",
    order.costPrice !== undefined ? Number(order.costPrice) || 0 : 0,
    order.sellPrice !== undefined ? Number(order.sellPrice) || 0 : 0,
    formula,
    order.customerName || "",
    order.phoneNumber || "",
    order.orderStatus || "pending",
    order.vendorName || "",
    order.vendorPaymentStatus || "unpaid"
  ];

  if (isNew) {
    sheet.appendRow(rowValues);
    var newLastRow = sheet.getLastRow();
    sheet.getRange(newLastRow, 6).setFormula(formula);
    formatDataRow(sheet, newLastRow, order.orderStatus || "pending");
  } else {
    sheet.getRange(targetRow, 1, 1, 11).setValues([rowValues]);
    sheet.getRange(targetRow, 6).setFormula(formula);
    formatDataRow(sheet, targetRow, order.orderStatus || "pending");
  }
}

function formatStatusCell(cell, status) {
  var s = String(status || '').trim().toLowerCase();
  cell.setHorizontalAlignment("center");
  cell.setFontWeight("bold");

  if (s.indexOf("completed") !== -1) {
    cell.setBackground("#16a34a"); // Green
    cell.setFontColor("#FFFFFF");
  } else if (s.indexOf("processing") !== -1) {
    cell.setBackground("#1e3a8a"); // Dark Blue
    cell.setFontColor("#FFFFFF");
  } else if (s.indexOf("cancel") !== -1 || s.indexOf("failed") !== -1) {
    cell.setBackground("#dc2626"); // Red
    cell.setFontColor("#FFFFFF");
  } else if (s.indexOf("pending") !== -1) {
    cell.setBackground("#FFDAB9"); // Peach
    cell.setFontColor("#431407"); // Dark contrast text
  }
}

function formatDataRow(sheet, rowNum, status) {
  sheet.getRange(rowNum, 4, 1, 3).setNumberFormat("#,##0");
  sheet.getRange(rowNum, 2).setHorizontalAlignment("center");
  var statusCell = sheet.getRange(rowNum, 9);
  statusCell.setHorizontalAlignment("center");
  if (status) {
    formatStatusCell(statusCell, status);
  }
}

function formatAllExistingRows(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var statusRange = sheet.getRange(2, 9, lastRow - 1, 1);
    var values = statusRange.getValues();
    for (var i = 0; i < values.length; i++) {
      var rowNum = i + 2;
      var status = values[i][0];
      if (status) {
        formatStatusCell(sheet.getRange(rowNum, 9), status);
      }
    }
  }
}

function setupStatusConditionalFormatting(sheet) {
  try {
    var maxRows = Math.max(sheet.getMaxRows() || 1000, 1000);
    var range = sheet.getRange("I2:I" + maxRows);
    var existingRules = sheet.getConditionalFormatRules() || [];
    var preservedRules = [];

    // Keep any existing rules that don't belong to column I
    for (var i = 0; i < existingRules.length; i++) {
      var rRanges = existingRules[i].getRanges();
      var affectsColI = false;
      for (var j = 0; j < rRanges.length; j++) {
        var a1 = rRanges[j].getA1Notation();
        if (a1.indexOf("I") !== -1) {
          affectsColI = true;
          break;
        }
      }
      if (!affectsColI) {
        preservedRules.push(existingRules[i]);
      }
    }

    // 1. Completed -> Green (#16a34a), white bold
    var completedRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains("completed")
      .setBackground("#16a34a")
      .setFontColor("#FFFFFF")
      .setBold(true)
      .setRanges([range])
      .build();

    // 2. Processing -> Dark Blue (#1e3a8a), white bold
    var processingRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains("processing")
      .setBackground("#1e3a8a")
      .setFontColor("#FFFFFF")
      .setBold(true)
      .setRanges([range])
      .build();

    // 3. Cancel / Cancelled -> Red (#dc2626), white bold
    var cancelRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains("cancel")
      .setBackground("#dc2626")
      .setFontColor("#FFFFFF")
      .setBold(true)
      .setRanges([range])
      .build();

    // 4. Pending -> Peach (#FFDAB9), dark brown bold text
    var pendingRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains("pending")
      .setBackground("#FFDAB9")
      .setFontColor("#431407")
      .setBold(true)
      .setRanges([range])
      .build();

    var updatedRules = preservedRules.concat([completedRule, processingRule, cancelRule, pendingRule]);
    sheet.setConditionalFormatRules(updatedRules);
  } catch (err) {
    Logger.log("Conditional formatting setup notice: " + err);
  }
}

/**
 * Run this function once from the Apps Script editor (select "applyColorsToSheet" and click "Run")
 * to instantly color all existing orders in your sheet!
 */
function applyColorsToSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  ensureHeaders(sheet);
  setupStatusConditionalFormatting(sheet);
  formatAllExistingRows(sheet);
  SpreadsheetApp.flush();
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "YT Tools Store Google Sheet Sync Webhook is Active!"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
