import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, File } from "lucide-react";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";

interface ExportButtonProps {
  data: any[];
  filename: string;
  title: string;
}

export function ExportButton({ data, filename, title }: ExportButtonProps) {
  const exportToPDF = () => {
    // Create a simple HTML table for PDF export
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              margin: 0;
              padding: 20px;
              color: #1f2937;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #2db89f;
            }
            .logo {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              margin-bottom: 15px;
            }
            .logo-icon {
              width: 48px;
              height: 48px;
              background: linear-gradient(135deg, #2db89f 0%, #22a366 100%);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
            h1 {
              color: #2db89f;
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 5px 0;
            }
            .subtitle {
              color: #6b7280;
              font-size: 14px;
              margin: 0;
            }
            .meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding: 15px;
              background: #f9fafb;
              border-radius: 8px;
              font-size: 12px;
              color: #4b5563;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            thead {
              background: linear-gradient(135deg, #2db89f 0%, #22a366 100%);
              color: white;
            }
            th {
              padding: 12px 16px;
              text-align: left;
              font-weight: 600;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 12px 16px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            tbody tr:hover {
              background: #f3f4f6;
            }
            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            }
            .badge-success { background: #d1fae5; color: #065f46; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-danger { background: #fee2e2; color: #991b1b; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <div class="logo-icon">EK</div>
              <div style="text-align: left;">
                <h1>e-KuraNeza Kibondo</h1>
                <p class="subtitle">Rwanda Health Platform</p>
              </div>
            </div>
          </div>
          <div class="meta">
            <div><strong>Report:</strong> ${title}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Records:</strong> ${data.length}</div>
          </div>
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${Object.values(row).map(value => `<td>${value || '-'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>&copy; 2026 e-KuraNeza Kibondo - Supporting Rwanda's Health Initiatives</p>
            <p>This document is confidential and intended for authorized personnel only.</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value || '');
          return stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 font-bold">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <FaFilePdf className="h-4 w-4 text-red-600" />
          <span className="font-semibold">Export as PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
          <FaFileExcel className="h-4 w-4 text-green-600" />
          <span className="font-semibold">Export as Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
