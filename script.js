// Utility function to parse data URLs
function parseDataUrl(url) {
  if (!url.startsWith('data:')) return null;
  
  const match = url.match(/^data:([^;]+)(;base64)?,(.*)$/);
  if (!match) return null;
  
  const mime = match[1];
  const isBase64 = !!match[2];
  const payload = match[3];
  
  let text = '';
  if (isBase64) {
    try {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      text = new TextDecoder().decode(bytes);
    } catch (e) {
      console.error('Failed to decode base64:', e);
      return null;
    }
  } else {
    try {
      text = decodeURIComponent(payload);
    } catch (e) {
      console.error('Failed to decode URI component:', e);
      return null;
    }
  }
  
  return { mime, isBase64, text };
}

// Function to detect delimiter in CSV
function detectDelimiter(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return ',';
  
  const delimiters = [',', ';', '\t'];
  const scores = {};
  
  delimiters.forEach(delimiter => {
    scores[delimiter] = 0;
    lines.slice(0, 3).forEach(line => {
      scores[delimiter] += (line.split(delimiter).length - 1);
    });
  });
  
  return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
}

// Function to parse CSV text
function parseCsv(text) {
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  
  const delimiter = detectDelimiter(text);
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) return { headers: [], rows: [] };
  
  // Check if first row is header (contains non-numeric values)
  const firstRow = lines[0].split(delimiter);
  const isHeader = firstRow.some(cell => isNaN(parseFloat(cell)));
  
  const headers = isHeader ? firstRow.map(h => h.trim()) : null;
  const startIndex = isHeader ? 1 : 0;
  
  const rows = [];
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    // Simple CSV parsing (doesn't handle escaped quotes properly)
    const cells = lines[i].split(delimiter).map(cell => {
      // Handle quoted fields
      if (cell.startsWith('"') && cell.endsWith('"')) {
        return cell.substring(1, cell.length - 1).replace(/""/g, '"');
      }
      return cell.trim();
    });
    
    rows.push(cells);
  }
  
  return { headers, rows };
}

// Main application logic
async function init() {
  const attachments = [
    {
      "name": "data.csv",
      "url": "data:text/csv;base64,aXRlbSxzYWxlcwpBcHBsZXMsMTIwLjUwCkJhbmFuYXMsODUuNzUKT3JhbmdlcywxNTAuMjUKR3JhcGVzLDk5LjAwCk1hbmdvZXMsMTMwLjQwCg=="
    }
  ];
  
  // Set document title from base64 encoded data
  document.title = "Sales Summary aXRlbSxzYWxlcwpBcHBsZXMsMTIwLjUwCkJhbmFuYXMsODUuNzUKT3JhbmdlcywxNTAuMjUKR3JhcGVzLDk5LjAwCk1hbmdvZXMsMTMwLjQwCg==";
  
  try {
    // Find the CSV attachment
    const csvAttachment = attachments.find(att => att.name === 'data.csv');
    if (!csvAttachment) throw new Error('CSV attachment not found');
    
    // Parse the data URL
    const parsedData = parseDataUrl(csvAttachment.url);
    if (!parsedData || !parsedData.text) throw new Error('Failed to parse CSV data');
    
    // Parse CSV content
    const { headers, rows } = parseCsv(parsedData.text);
    
    // Find sales column index
    const salesColumnIndex = headers ? headers.findIndex(h => h.toLowerCase() === 'sales') : 1;
    if (salesColumnIndex === -1) throw new Error('Sales column not found');
    
    // Calculate total sales
    let totalSales = 0;
    rows.forEach(row => {
      const salesValue = parseFloat(row[salesColumnIndex]);
      if (!isNaN(salesValue)) {
        totalSales += salesValue;
      }
    });
    
    // Display total sales
    document.getElementById('total-sales').textContent = totalSales.toFixed(2);
  } catch (error) {
    console.error('Error processing sales data:', error);
    document.getElementById('total-sales').textContent = 'Error';
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}