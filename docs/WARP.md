# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

DieCastTracker is a Hot Wheels collection management system with both CLI and web interfaces. The application manages die-cast model collections using an Excel file as the data store.

## Architecture

### Core Components
- **FastAPI Web Application** (`app.py`) - Modern web interface with REST API
- **CLI Interface** (`main.py`) - Terminal-based menu system
- **Excel Data Store** (`data/HW_list.xlsx`) - Simple Excel file with columns: S.No, Model Name, Series
- **Scripts Directory** - Individual CLI tools for specific operations

### Data Model
The Excel file uses a simple 3-column structure:
- `S.No` - Auto-incrementing serial number
- `Model Name` - Name of the die-cast model
- `Series` - Series/subseries name (stores the subseries value from web interface)

### Web Application Flow
The web interface implements a cascading dropdown system:
1. User selects main series (Mainlines, Semi-Premiums, Premiums)
2. Subseries dropdown populates based on series selection
3. The **subseries value** is stored in Excel's "Series" column

## Commands

### Quick Start with npm scripts
```powershell
npm start          # Start web application (production)
npm run web        # Same as npm start
npm run dev        # Start with auto-reload (development)
npm run cli        # Start CLI interface
```

### Individual Operations
```powershell
npm run add        # Add models via CLI
npm run search     # Search existing models
npm run stats      # View collection stats
npm run field      # Add new Excel columns
npm run excel      # Open Excel file directly
```

### Development & Setup
```powershell
npm run install    # Install Python dependencies
npm run venv       # Create virtual environment
npm run activate   # Activate virtual environment (Windows)
npm run freeze     # Update requirements.txt
npm run help       # Show available commands
```

### Direct Python Commands (Alternative)
```powershell
python start_web.py            # Start web application
python app.py                  # Development server with auto-reload
python main.py                 # CLI interface
python scripts/add_model.py    # Add models via CLI
python scripts/search_model.py # Search existing models
python scripts/statistics.py   # View collection stats
python scripts/add_field.py    # Add new Excel columns
```

## Key Implementation Details

### Series/Subseries Configuration
The web interface uses predefined series options in `app.py`:
- **Mainlines**: "Mainlines", "57th Anniversary Series"
- **Semi-Premiums**: "Ultra Hots", "Silver Series BMW", etc.
- **Premiums**: "Premiums Pop Culture", "Premiums Boulevard"

### API Endpoints
- `GET /` - Main collection view
- `GET /add` - Add new model form
- `GET /api/data` - Get all collection data
- `GET /api/dropdown-options` - Get series/subseries options
- `POST /api/add-model` - Add new model to Excel

### File Structure
```
├── app.py              # FastAPI web application
├── main.py             # CLI launcher
├── start_web.py        # Web server startup script
├── data/
│   └── HW_list.xlsx    # Excel data store
├── scripts/            # CLI tools
├── templates/          # HTML templates
│   ├── index.html      # Main collection view
│   └── add_model.html  # Add model form
└── static/             # Web assets
    ├── style.css       # Styles
    ├── script.js       # Main page JS
    └── add_model.js    # Add form JS
```

## Development Notes

### Adding New Series/Subseries
Update the `SERIES_OPTIONS` dictionary in `app.py` to add new series or subseries options.

### Excel File Compatibility
- Always maintain the 3-column structure
- Serial numbers auto-increment from the last row
- The web interface stores subseries values in the "Series" column
- CLI scripts may use different logic for series selection

### Frontend Dependencies
- Font Awesome 6.0.0 (CDN)
- Modern CSS with CSS Grid and Flexbox
- Vanilla JavaScript (no frameworks)

## Testing

### Manual Testing Workflow
1. Start web application: `python start_web.py`
2. Navigate to http://localhost:8000
3. Test main collection view loads
4. Click "Add Model" button
5. Test cascading dropdown (Series → Subseries)
6. Add a test model and verify Excel file updates
7. Return to main view and verify new model appears

### Data Validation
- Model name is required and trimmed
- Series and subseries selections are required
- Excel file creates automatically if missing
- Serial numbers increment correctly

## Common Issues

### Excel File Permissions
If adding models fails, ensure the Excel file isn't open in another application.

### Port Conflicts
Default web server runs on port 8000. Change in `start_web.py` if needed.

### Python Dependencies
Key packages: `fastapi`, `uvicorn`, `pandas`, `openpyxl`, `jinja2`