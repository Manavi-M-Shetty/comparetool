"""
Service for updating Excel files with comparison results.
Safely handles Excel file operations and preserves existing formatting.
"""
import os
import sys
from datetime import datetime
from typing import List, Optional, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from models.schemas import FileDiff
from utils.file_utils import path_exists


def check_excel_open(excel_path: str) -> bool:
    """
    Check if Excel file is open by attempting to open it in write mode.
    
    Args:
        excel_path: Path to Excel file
        
    Returns:
        True if file appears to be open, False otherwise
    """
    if not path_exists(excel_path):
        return False
    
    try:
        # Try to open file in append mode - will fail if file is open
        with open(excel_path, "r+b"):
            return False
    except (PermissionError, IOError):
        return True


def update_excel_file(
    excel_path: str,
    file_diffs: List[FileDiff],
    sheet_name: str = "Configuration Comparison"
) -> Tuple[bool, str, int]:
    """
    Update Excel file with comparison results.
    Preserves existing formatting and adds new rows.
    
    Args:
        excel_path: Path to Excel file
        file_diffs: List of FileDiff objects
        sheet_name: Name of the sheet to update
        
    Returns:
        Tuple of (success, message, updated_rows)
    """
    # Check if Excel is open
    if check_excel_open(excel_path):
        return False, "Please close Excel file first", 0
    
    try:
        # Load existing workbook or create new one
        if path_exists(excel_path):
            try:
                workbook = load_workbook(excel_path)
            except Exception as e:
                return False, f"Error opening Excel file: {str(e)}", 0
        else:
            workbook = Workbook()
            # Remove default sheet if it exists
            if "Sheet" in workbook.sheetnames:
                workbook.remove(workbook["Sheet"])
        
        # Get or create the target sheet
        if sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
        else:
            sheet = workbook.create_sheet(sheet_name)
            # Add headers if new sheet
            headers = ["Component Name", "Config File Name", "Changes", "Date of Comparison"]
            sheet.append(headers)
            # Style headers
            header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            header_font = Font(bold=True, color="FFFFFF")
            for cell in sheet[1]:
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center")
        
        # Find the last row with data
        max_row = sheet.max_row
        start_row = max_row + 1
        
        # Prepare data rows
        updated_rows = 0
        comparison_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        for file_diff in file_diffs:
            if not file_diff.has_changes:
                continue
            
            # Generate change summary
            added = sum(1 for line in file_diff.diff_lines if line.line_type == "added")
            removed = sum(1 for line in file_diff.diff_lines if line.line_type == "removed")
            
            change_summary = "No changes detected"
            if added > 0 or removed > 0:
                parts = []
                if added > 0:
                    parts.append(f"{added} line(s) added")
                if removed > 0:
                    parts.append(f"{removed} line(s) removed")
                change_summary = "; ".join(parts)
            
            # Add row
            row_data = [
                file_diff.component_name,
                file_diff.file_name,
                change_summary,
                comparison_date
            ]
            sheet.append(row_data)
            updated_rows += 1
        
        # Auto-adjust column widths
        for column in sheet.columns:
            max_length = 0
            column_letter = get_column_letter(column[0].column)
            for cell in column:
                try:
                    if cell.value:
                        max_length = max(max_length, len(str(cell.value)))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            sheet.column_dimensions[column_letter].width = adjusted_width
        
        # Save workbook
        workbook.save(excel_path)
        workbook.close()
        
        message = f"Excel updated successfully. Added {updated_rows} row(s)."
        return True, message, updated_rows
        
    except PermissionError:
        return False, "Please close Excel file first", 0
    except Exception as e:
        return False, f"Error updating Excel: {str(e)}", 0
