import { useState } from "react";
import { Download, FileText, FileJson, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportDropdownProps {
  onExportHTML?: () => void;
  onExportJSON?: () => void;
  onPrint?: () => void;
  data?: any;
  filename?: string;
  disabled?: boolean;
}

export function ExportDropdown({
  onExportHTML,
  onExportJSON,
  onPrint,
  data,
  filename = "export",
  disabled = false,
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportHTML = () => {
    if (onExportHTML) {
      onExportHTML();
    } else {
      // Default HTML export - creates a printable HTML document
      const printContent = document.querySelector('[data-export-content]')?.innerHTML || document.body.innerHTML;
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; font-weight: bold; }
    h1, h2, h3 { color: #333; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .summary-card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .text-green-600 { color: #16a34a; }
    .text-blue-600 { color: #2563eb; }
    .text-red-600 { color: #dc2626; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GLAZER - ${filename}</h1>
    <p>Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  </div>
  ${printContent}
</body>
</html>`;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    if (onExportJSON) {
      onExportJSON();
    } else if (data) {
      // Default JSON export
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setIsOpen(false);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportHTML} data-testid="menu-export-html">
          <FileText className="h-4 w-4 mr-2" />
          Export as HTML
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportJSON} 
          disabled={!data && !onExportJSON}
          data-testid="menu-export-json"
        >
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint} data-testid="menu-print">
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
