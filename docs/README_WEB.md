# DieCast Tracker - Web Application

A modern FastAPI web application for displaying and managing your Hot Wheels die-cast car collection with an elegant, responsive interface.

## Features

### 🎨 Modern Web Interface
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Hot Wheels Theme**: Beautiful gradient background and car-themed icons
- **Real-time Statistics**: Display total models, data fields, and current view count
- **Interactive Search**: Live search across all data fields with instant filtering

### 🔍 Advanced Functionality
- **Live Search**: Search across all columns with real-time results
- **CSV Export**: Export your filtered data with one click
- **Auto-refresh**: Reload data from Excel file instantly
- **Error Handling**: Graceful error handling with user-friendly messages

### 📊 Data Management
- **Excel Integration**: Automatically reads from `data/HW_list.xlsx`
- **Dynamic Tables**: Automatically adapts to any Excel file structure
- **Data Validation**: Handles empty cells and various data types

## Quick Start

### 1. Setup (First Time Only)
```bash
# Navigate to project directory
cd "C:\Users\Ankur Ram\OneDrive\Desktop\Workspace\Python\DieCastTracker"

# Activate virtual environment
venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -r requirements.txt
```

### 2. Start the Web Application
```bash
# Method 1: Using the startup script (Recommended)
python start_web.py

# Method 2: Direct uvicorn command
uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# Method 3: Direct Python
python app.py
```

### 3. Access the Application
- **Web Interface**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## API Endpoints

### `GET /`
- Returns the main web interface
- Modern HTML page with responsive design

### `GET /api/data`
- Returns all Excel data as JSON
- Includes data, columns, and statistics

### `GET /api/stats`
- Returns detailed collection statistics
- Column information and data analysis

### `GET /api/search?q=<query>`
- Search functionality via API
- Returns filtered results based on query

## File Structure

```
DieCastTracker/
├── app.py              # FastAPI web application
├── start_web.py        # Easy startup script
├── main.py             # Original CLI application
├── requirements.txt    # Python dependencies
├── data/
│   └── HW_list.xlsx   # Your Hot Wheels collection data
├── templates/
│   └── index.html     # Modern web interface
├── static/
│   ├── style.css      # Modern styling
│   └── script.js      # Interactive functionality
└── scripts/           # Original CLI scripts
    ├── add_model.py
    ├── search_model.py
    ├── statistics.py
    └── add_field.py
```

## Usage Tips

### 🔍 Searching
- Search works across all data fields
- Search is case-insensitive
- Use the clear button (×) to reset search
- Results update in real-time as you type

### 📤 Exporting Data
- Click "Export CSV" to download your data
- Export includes only the currently filtered results
- File is automatically named with today's date

### 🔄 Refreshing Data
- Click "Refresh" to reload data from Excel file
- Useful after updating the Excel file externally
- Maintains your current search query

## Customization

### Adding New Data
1. Open `data/HW_list.xlsx` in Excel
2. Add new rows or columns as needed
3. Save the file
4. Click "Refresh" in the web interface

### Styling Changes
- Edit `static/style.css` for visual customization
- Modify CSS variables in `:root` for color themes
- All changes auto-reload during development

### Functionality Changes
- Edit `static/script.js` for frontend behavior
- Modify `app.py` for backend API changes
- Add new endpoints following FastAPI patterns

## Technical Details

### Technologies Used
- **Backend**: FastAPI + Python
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3
- **Data Processing**: Pandas + OpenPyXL
- **Server**: Uvicorn ASGI server

### Dependencies
- `fastapi`: Modern web framework
- `uvicorn`: ASGI web server
- `pandas`: Data manipulation
- `openpyxl`: Excel file handling
- `jinja2`: Template rendering
- `aiofiles`: Async file operations

### Performance
- Async/await for non-blocking operations
- Efficient data loading and caching
- Responsive design for all screen sizes
- Optimized for collections up to 10,000+ models

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill existing process or use different port
uvicorn app:app --port 8001
```

**Excel File Not Found**
- Ensure `data/HW_list.xlsx` exists
- Check file permissions
- Use absolute path if needed

**Virtual Environment Issues**
```bash
# Recreate virtual environment
rm -rf venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Development Mode
- Files auto-reload when changed
- Detailed error messages in console
- API docs available at `/docs`

## Support

For issues or questions:
1. Check the console for error messages
2. Verify Excel file format and location
3. Ensure all dependencies are installed
4. Review the API documentation at `/docs`

---

**Built with ❤️ for Hot Wheels collectors everywhere!** 🚗