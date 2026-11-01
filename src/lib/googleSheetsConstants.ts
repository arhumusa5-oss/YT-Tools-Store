/**
 * Ready-to-deploy Google Apps Script for the user's Google Sheet
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * ====================================================================
 * YT Tools Store - Real-time Google Sheet Auto-Sync & Backup Script
 * ====================================================================
 * 
 * SETUP INSTRUCTIONS (2 Minutes):
 * 1. Open your Google Sheet (or create a new empty Google Sheet).
 * 2. In the top menu, click: Extensions -> Apps Script.
 * 3. Delete any default code in Code.gs, and PASTE this entire script.
 * 4. Click the "Save" icon (or Ctrl+S / Cmd+S).
 * 5. Click "Deploy" (top right) -> "New deployment".
 * 6. Click the gear icon next to "Select type" and choose "Web app".
 * 7. Set:
 *    - Description: "YT Tools Store Webhook"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone"
 * 8. Click "Deploy", approve access/permissions if prompted, and COPY the Web App URL.
 * 9. Paste that URL into your YT Tools Store Admin Settings -> Google Sheets Sync.
 * 10. Done! Every order created, updated, cancelled, or refunded will auto-sync here!
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
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Connected successfully to Google Sheet: "' + sheet.getName() + '"'
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
        sheet.getRange(row, 9).setValue("cancelled / deleted");
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
    formatDataRow(sheet, newLastRow);
  } else {
    sheet.getRange(targetRow, 1, 1, 11).setValues([rowValues]);
    sheet.getRange(targetRow, 6).setFormula(formula);
    formatDataRow(sheet, targetRow);
  }
}

function formatDataRow(sheet, rowNum) {
  sheet.getRange(rowNum, 4, 1, 3).setNumberFormat("#,##0");
  sheet.getRange(rowNum, 2).setHorizontalAlignment("center");
  sheet.getRange(rowNum, 9).setHorizontalAlignment("center");
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "YT Tools Store Google Sheet Sync Webhook is Active!"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
