# DieCastTracker - Hot Wheels Collection Management System

A comprehensive Python-based system for managing your Hot Wheels die-cast car collection with Excel integration, statistics, and an intuitive web interface.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Web Interface](#web-interface)
- [Usage Guide](#usage-guide)
- [Scripts Overview](#scripts-overview)
- [Data Management](#data-management)
- [Statistics & Analytics](#statistics--analytics)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Functionality
- **Add Models**: Easily add new Hot Wheels cars to your collection
- **Update Models**: Edit existing models with automatic backup protection
- **Delete Models**: Remove models with safety confirmations and backup
- **Search & Filter**: Find specific models by name, brand, or series
- **Statistics Dashboard**: Comprehensive analytics of your collection
- **Field Management**: Add custom fields to track additional data
- **Preorders Tracking**: Track preorders with seller, models, ETA, pricing, and delivery status
- **Excel Integration**: Full Excel file support with automatic creation
- **Automatic Backups**: Smart backup system keeping at most 5 backups per Excel file

### User Experience
- **Interactive CLI**: Command-line interface with menu system
- **Modern Web Interface**: Responsive design with collapsible sidebar navigation
- **Quick Shortcuts**: Use `#13` format for rapid series selection
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Multiple Launch Options**: CLI menu, web interface, batch files, and direct scripts
- **Safety Features**: Double confirmation for deletions, automatic backups

### Analytics & Insights
- **Collection Statistics**: Total count, series breakdown, diversity metrics
- **Preorder Statistics**: Track total value, PO amounts, payment status
- **Visual Charts**: Distribution charts and progress tracking
- **Milestone Tracking**: Progress toward collection goals
- **Recent Additions**: Track your latest acquisitions
- **Model Analysis**: Common words, average name length, and more

## Project Structure

```
DieCastTracker/
├── pages/                      # Web interface pages
│   ├── home/                  # Home page with collection listing
│   ├── add-model/             # Add new models page
│   ├── add-field/             # Add custom fields page
│   ├── analytics/             # Analytics and statistics page
│   ├── preorders/             # Preorders tracking page
│   └── series-management/     # Series configuration page
├── static/                    # Static assets (CSS, JS)
│   ├── shared.css            # Shared styles including sidebar
│   └── sidebar.js            # Sidebar collapse functionality
├── utils/                     # Utility modules
│   ├── backup_utils.py       # Backup management (5 backups max)
│   └── cleanup_backups.py    # One-time backup cleanup script
├── data/                      # Data storage
│   ├── HW_list.xlsx          # Main collection database
│   ├── preorders.xlsx        # Preorders database
│   └── backups/              # Automatic backups (5 per file)
├── app.py                     # FastAPI web application
├── main.py                    # CLI interactive launcher
├── start_web.py               # Web server launcher
├── Desktop_DieCast_Tracker.bat # Desktop launcher for Windows
├── package.json               # NPM-style script definitions
└── README.md                  # This file
```

## Installation

### Prerequisites
- **Python 3.6+** (tested with Python 3.10)
- **Required libraries**: openpyxl, pandas, fastapi, uvicorn, jinja2

### Setup
1. **Clone or download** this repository
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   Or install individually:
   ```bash
   pip install openpyxl pandas fastapi uvicorn jinja2 python-multipart
   ```
3. **Navigate to project directory**:
   ```bash
   cd DieCastTracker
   ```

### Quick Verification
```bash
# Test CLI interface
python main.py

# Test web interface
python start_web.py
```

## Quick Start

### Option 1: Web Interface (Recommended)
```bash
python start_web.py
```
- Open browser to `http://localhost:8000`
- Modern, responsive interface
- All features accessible via sidebar navigation
- Real-time updates and statistics

### Option 2: Interactive CLI Menu
```bash
python main.py
```
- Choose from numbered options
- Navigate through all features
- Built-in help and system info

### Option 3: Direct Script Execution
```bash
# Add a new car
python pages/add-model/add_model.py

# Search your collection
python pages/home/home.py

# View statistics
python pages/analytics/analytics.py
```

### Option 4: Platform-Specific Launchers
```bash
# Windows
Desktop_DieCast_Tracker.bat

# Or use run.bat (if available)
.\run.bat
```

## Web Interface

### Starting the Web Server
```bash
python start_web.py
```
The web interface will be available at `http://localhost:8000`

### Available Pages
- **Home**: View and manage your collection with edit/delete functionality
- **Add Model**: Add new Hot Wheels cars to your collection
- **Add Field**: Add custom fields to track additional data
- **Analytics**: Comprehensive statistics and visualizations
- **Preorders**: Track preorders with delivery status, pricing, and payment tracking
- **Series Management**: Configure and manage series/subseries options

### Features
- **Collapsible Sidebar**: Floating sidebar that can be collapsed for more screen space
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Changes reflect immediately without page refresh
- **Inline Editing**: Edit models and preorders directly from the listing
- **Status Management**: Dropdown menus for quick status updates
- **Payment Tracking**: Automatic calculation of payment done and remaining for preorders

## Usage Guide

### Adding New Models

**Via Web Interface:**
1. Navigate to "Add Model" in the sidebar
2. Enter model name
3. Select series and subseries
4. Click "Add Model"

**Via CLI:**
1. Run `python main.py` and select option 1
2. Enter model name (can use `#13` shortcut for series)
3. Select series and subseries
4. Continue adding or type `exit` to finish

### Managing Preorders

**Via Web Interface:**
1. Navigate to "Preorders" in the sidebar
2. Click "Add Preorder" to create a new entry
3. Fill in seller, models, ETA (month format), pricing, and delivery status
4. Use the dropdown to update delivery status directly
5. View payment statistics (Payment Done, Payment Remaining)

**Preorder Fields:**
- **Seller**: Name of the seller/vendor
- **Models**: Description of preordered models
- **ETA**: Expected delivery month (YYYY-MM format)
- **Total Price**: Total cost of the preorder
- **PO Amount**: Amount paid upfront
- **On Arrival Amount**: Amount due on delivery
- **Delivery Status**: Pending, Shipped, or Delivered

### Searching Your Collection

**Via Web Interface:**
1. Use the search bar on the Home page
2. Filter by model name, series, or any custom field

**Via CLI:**
1. Run `python main.py` and select option 2
2. Enter search terms (brand, model, or partial match)
3. View results with serial numbers and series info

### Viewing Statistics

**Via Web Interface:**
1. Navigate to "Analytics" in the sidebar
2. View comprehensive collection statistics
3. See series breakdown and visual charts

**Via CLI:**
1. Run `python main.py` and select option 3
2. Get comprehensive insights including:
   - Total collection count
   - Series breakdown with percentages
   - Most/least popular series
   - Collection diversity metrics
   - Recent additions
   - Milestone progress
   - Visual distribution charts

## Data Management

### Excel File Structure

**Main Collection** (`data/HW_list.xlsx`):
- S.No (Serial Number)
- Model Name
- Series
- [Custom fields added via Add Field page]

**Preorders** (`data/preorders.xlsx`):
- S.No (Serial Number)
- Seller
- Models
- ETA (YYYY-MM format)
- Total Price
- PO Amount
- On Arrival Amount
- Delivery Status (Pending/Shipped/Delivered)
- Date Added

### Automatic Backup System

The system automatically creates backups before any modification:

- **Backup Location**: `data/backups/`
- **Backup Retention**: Maximum 5 backups per Excel file
- **Backup Naming**: `{filename}_backup_YYYYMMDD_HHMMSS.xlsx`
- **Latest Backup**: `{filename}_backup_latest.xlsx` (always updated)

**How It Works:**
1. Before any write operation, a timestamped backup is created
2. The "latest" backup is also updated
3. Old backups beyond 5 are automatically deleted (newest first)
4. Each Excel file maintains its own set of 5 backups

**Manual Cleanup:**
If you need to clean up existing backups:
```bash
python utils/cleanup_backups.py
```

### File Organization
- **Web Pages**: All HTML/CSS/JS in `pages/` folder
- **Static Assets**: CSS and JS in `static/` folder
- **Data**: Excel files in `data/` folder
- **Backups**: Automatic backups in `data/backups/` folder
- **Utilities**: Helper scripts in `utils/` folder

## Statistics & Analytics

### Collection Overview
- **Total Cars**: Complete count of your collection
- **Series Breakdown**: Count and percentage for each series
- **Diversity Metrics**: How varied your collection is

### Preorder Statistics
- **Total Preorders**: Count of all preorders
- **Total Value**: Sum of all preorder total prices
- **PO Amount**: Total amount paid upfront
- **On Arrival**: Total amount due on delivery
- **Payment Done**: PO amounts + on-arrival for Shipped/Delivered items
- **Payment Remaining**: On-arrival amounts for Pending items
- **Status Breakdown**: Count by delivery status

### Detailed Analysis
- **Most Popular Series**: Your most collected series
- **Least Popular Series**: Rare series in your collection
- **Model Name Insights**: Common words and patterns
- **Average Name Length**: Statistical analysis of naming

### Visual Charts
- **Distribution Charts**: Visual representation of series distribution
- **Progress Tracking**: Visual representation of collection growth
- **Milestone Tracking**: Automatic milestone detection (10, 25, 50, 100, 250, 500, 1000)

## Troubleshooting

### Common Issues

#### "Excel file not found"
- **Cause**: Excel file missing or in wrong location
- **Solution**: Run any script to auto-create the file

#### "Script not found"
- **Cause**: Running from wrong directory
- **Solution**: Ensure you're in the DieCastTracker root directory

#### "Permission denied" (Linux/Mac)
- **Cause**: Shell script not executable
- **Solution**: Run `chmod +x run.sh`

#### Import errors
- **Cause**: Missing required libraries
- **Solution**: Run `pip install -r requirements.txt`

#### Web interface not starting
- **Cause**: Port 8000 may be in use
- **Solution**: Close other applications using port 8000, or modify `start_web.py` to use a different port

#### Backup errors
- **Cause**: Insufficient disk space or permissions
- **Solution**: Check disk space and ensure write permissions for `data/backups/` directory

### File Path Issues
- **Scripts**: Use `python pages/page_name/page_name.py`
- **Data**: Excel files should be in `data/` folder
- **Working Directory**: Always run from project root

### Performance Tips
- **Large Collections**: Statistics may take longer with 1000+ cars
- **Excel File Size**: Consider archiving old data if file becomes too large
- **Memory Usage**: Close Excel before running scripts for better performance
- **Backup Cleanup**: Run `cleanup_backups.py` periodically if you have many old backups

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Follow PEP 8 guidelines
- Use meaningful variable names
- Add docstrings to functions
- Include error handling
- Remove emojis from code (use text indicators like [SUCCESS], [ERROR])

### Feature Requests
- Open an issue with detailed description
- Include use cases and examples
- Consider backward compatibility

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Future Enhancements

### Planned Features
- **Mobile App**: Smartphone collection tracking
- **Cloud Sync**: Google Sheets integration
- **Barcode Scanning**: QR code support
- **Market Value Tracking**: Price history and current values
- **Trading System**: Track trades with other collectors
- **Wishlist Management**: Track desired cars
- **Photo Integration**: Add car images
- **Export Options**: CSV, JSON, PDF reports

### Technical Improvements
- **Database Migration**: SQLite/PostgreSQL support
- **API Integration**: Hot Wheels database connectivity
- **Advanced Search**: Filter by multiple criteria
- **Data Validation**: Enhanced input checking
- **Performance Optimization**: Faster processing for large collections

---

## Happy Collecting!

DieCastTracker makes managing your Hot Wheels collection fun and organized. Whether you're a casual collector or a serious enthusiast, this tool helps you keep track of your cars, analyze your collection, track preorders, and set goals for the future.

**Start your collection journey today!**

```bash
# Web Interface (Recommended)
python start_web.py

# Or CLI Interface
python main.py
```

---

*Made for Hot Wheels collectors worldwide*
