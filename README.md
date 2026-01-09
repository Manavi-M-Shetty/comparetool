# Configuration Comparison Tool

A full-stack application similar to WinMerge for comparing configuration files across two folders recursively. The tool matches components by subfolder name and config files by filename, generates unified diffs, and automatically updates Excel files with comparison results.

## Features

- 🔍 **Recursive Folder Comparison**: Compare two folders containing config files
- 📊 **Component Matching**: Automatically matches components by subfolder name and files by filename
- 📝 **Unified Diff Generation**: Uses Python's difflib to generate detailed diff reports
- 📈 **Excel Integration**: Automatically updates Excel files with comparison results
- 🎨 **WinMerge-like UI**: Side-by-side diff viewer with syntax highlighting
- ⚡ **One-Click Operation**: Compare and update Excel in a single operation
- 🛡️ **Error Handling**: Safely handles permission errors, missing files, and open Excel files

## Tech Stack

### Backend
- **Python 3.8+**
- **FastAPI** - Modern, fast web framework
- **Uvicorn** - ASGI server
- **difflib** - Built-in diff generation
- **openpyxl** - Excel file manipulation
- **Pydantic** - Data validation

### Frontend
- **React 19** - UI framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Vite** - Build tool

## Project Structure

```
ConfigCompareTool/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── services/
│   │   ├── folder_compare.py  # Folder scanning and matching logic
│   │   ├── diff_service.py     # Diff generation service
│   │   └── excel_service.py    # Excel file update service
│   ├── models/
│   │   └── schemas.py          # Pydantic models for API
│   └── utils/
│       └── file_utils.py       # Safe file operations
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.jsx        # Main application page
│   │   ├── components/
│   │   │   ├── DiffViewer.jsx  # Side-by-side diff viewer
│   │   │   ├── FolderTree.jsx  # Folder/file tree display
│   │   │   ├── CompareButton.jsx
│   │   │   └── StatusBar.jsx
│   │   ├── utils/
│   │   │   └── api.js          # API client functions
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Installation & Setup

### Prerequisites

- **Python 3.8+** installed
- **Node.js 16+** and npm installed
- **Windows OS** (tested on Windows 10/11)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
venv\Scripts\activate.bat
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start the Backend Server

1. Navigate to the backend directory
2. Activate your virtual environment (if using one)
3. Run the FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation (Swagger UI) at `http://localhost:8000/docs`

### Start the Frontend Development Server

1. Navigate to the frontend directory
2. Start the Vite dev server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### Using the Web UI

1. **Open the application** in your browser at `http://localhost:3000`

2. **Select Folders**:
   - Enter the path to the **Old Folder** (e.g., `C:\Configs\Old`)
   - Enter the path to the **New Folder** (e.g., `C:\Configs\New`)
   - Optionally enter the path to an **Excel File** (e.g., `C:\Reports\comparison.xlsx`)

3. **Click "Compare and Update"**:
   - The tool will recursively scan both folders
   - Match components by subfolder name
   - Match config files by filename
   - Generate diffs for each matched file
   - Update the Excel file (if provided)

4. **View Results**:
   - See summary statistics (total components, components with changes)
   - Browse the list of files with changes
   - Click "View Diff" to see side-by-side comparison
   - Check the status bar for progress and errors

### Using the API Directly

#### Compare Two Folders
```bash
POST http://localhost:8000/compare-folders
Content-Type: application/json

{
  "old_folder": "C:\\Configs\\Old",
  "new_folder": "C:\\Configs\\New"
}
```

#### Scan Folders (Get Matched Pairs)
```bash
POST http://localhost:8000/scan-folders
Content-Type: application/json

{
  "old_folder": "C:\\Configs\\Old",
  "new_folder": "C:\\Configs\\New"
}
```

#### Update Excel File
```bash
POST http://localhost:8000/update-excel
Content-Type: application/json

{
  "excel_path": "C:\\Reports\\comparison.xlsx",
  "file_diffs": [...]
}
```

#### Combined Operation (Compare and Update)
```bash
POST http://localhost:8000/compare-and-update
Content-Type: application/json

{
  "old_folder": "C:\\Configs\\Old",
  "new_folder": "C:\\Configs\\New",
  "excel_path": "C:\\Reports\\comparison.xlsx"
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/compare` | POST | Compare two individual files |
| `/scan-folders` | POST | Scan folders and return matched file pairs |
| `/compare-folders` | POST | Compare folders and return all diffs |
| `/update-excel` | POST | Update Excel file with comparison results |
| `/compare-and-update` | POST | Combined: compare folders and update Excel |

## Excel File Format

The tool updates Excel files with the following structure:

**Sheet Name**: "Configuration Comparison"

| Column | Description |
|--------|-------------|
| Component Name | Name of the component (subfolder) |
| Config File Name | Name of the config file |
| Changes | Summary of changes (e.g., "5 line(s) added; 2 line(s) removed") |
| Date of Comparison | Timestamp of when comparison was performed |

**Note**: The tool preserves existing formatting and only adds new rows. If the sheet doesn't exist, it will be created with headers.

## Error Handling

The tool handles various error scenarios gracefully:

- **Permission Errors**: Skips unreadable files and continues processing
- **Missing Files**: Shows "Config not found for {component}, skipping" message
- **Open Excel Files**: Returns "Please close Excel file first" error
- **No Changes**: Writes "No changes detected" in Excel
- **Invalid Paths**: Returns 404 errors with descriptive messages

## Development

### Backend Development

The backend uses a modular structure:
- **Services**: Business logic for comparison, diff generation, and Excel updates
- **Models**: Pydantic schemas for type-safe API requests/responses
- **Utils**: Reusable utility functions for file operations

### Frontend Development

The frontend uses React with functional components:
- **Pages**: Main application views
- **Components**: Reusable UI components
- **Utils**: API client and helper functions

### Building for Production

**Frontend**:
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

**Backend**:
The backend can be deployed using any ASGI server (Uvicorn, Gunicorn, etc.)

## Troubleshooting

### Backend Issues

1. **Import Errors**: Make sure all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

2. **Port Already in Use**: Change the port in the uvicorn command:
   ```bash
   uvicorn main:app --reload --port 8001
   ```

3. **Excel File Locked**: Close the Excel file before running the comparison

### Frontend Issues

1. **CORS Errors**: Ensure the backend CORS middleware allows `http://localhost:3000`

2. **API Connection Failed**: Verify the backend is running on port 8000

3. **Build Errors**: Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## License

This project is provided as-is for configuration comparison purposes.

## Contributing

This is a production-ready tool. For enhancements:
1. Follow the existing code structure
2. Add error handling for edge cases
3. Update tests if applicable
4. Document any new features

---

**Built with ❤️ for configuration management**
#   c o m p a r e t o o l  
 