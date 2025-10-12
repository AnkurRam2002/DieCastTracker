# 🚗 DieCastTracker - Hot Wheels Collection Management System

A comprehensive Python-based system for managing your Hot Wheels die-cast car collection with Excel integration, statistics, and an intuitive user interface.

## 📋 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [Scripts Overview](#-scripts-overview)
- [Custom Run Commands](#-custom-run-commands)
- [Data Management](#-data-management)
- [Statistics & Analytics](#-statistics--analytics)
- [Documentation](#-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🎯 Core Functionality
- **Add Models**: Easily add new Hot Wheels cars to your collection
- **Update Models**: Edit existing models with automatic backup protection
- **Delete Models**: Remove models with safety confirmations and backup
- **Search & Filter**: Find specific models by name, brand, or series
- **Statistics Dashboard**: Comprehensive analytics of your collection
- **Field Management**: Add custom fields to track additional data
- **Excel Integration**: Full Excel file support with automatic creation
- **Automatic Backups**: Timestamped and latest backups before any changes

### 🚀 User Experience
- **Interactive Menus**: Beautiful, emoji-rich command-line interface
- **Modern Web Interface**: Responsive design with edit/delete buttons
- **Quick Shortcuts**: Use `#13` format for rapid series selection
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Multiple Launch Options**: Main menu, batch files, and direct scripts
- **Safety Features**: Double confirmation for deletions, automatic backups

### 📊 Analytics & Insights
- **Collection Statistics**: Total count, series breakdown, diversity metrics
- **Visual Charts**: ASCII-based distribution charts
- **Milestone Tracking**: Progress toward collection goals
- **Recent Additions**: Track your latest acquisitions
- **Model Analysis**: Common words, average name length, and more

## 📁 Project Structure

```
DieCastTracker/
├── 📂 scripts/                 # Python scripts
│   ├── add_model.py           # Add new cars to collection
│   ├── search_model.py        # Search existing cars
│   ├── statistics.py          # Collection analytics
│   └── add_field.py           # Add custom database fields
├── 📂 data/                   # Data storage
│   └── HW_list.xlsx          # Main collection database
├── 📄 main.py                 # Interactive main launcher
├── 📄 run.bat                 # Windows batch script
├── 📄 run.sh                  # Linux/Mac shell script
├── 📄 package.json            # NPM-style script definitions
└── 📄 README.md               # This file
```

## 🛠️ Installation

### Prerequisites
- **Python 3.6+** (tested with Python 3.10)
- **openpyxl** library for Excel file handling

### Setup
1. **Clone or download** this repository
2. **Install dependencies**:
   ```bash
   pip install openpyxl
   ```
3. **Navigate to project directory**:
   ```bash
   cd DieCastTracker
   ```

### Quick Verification
```bash
python main.py
```

## 🚀 Quick Start

### Option 1: Interactive Main Menu (Recommended)
```bash
python main.py
```
- Choose from numbered options
- Navigate through all features
- Built-in help and system info

### Option 2: Direct Script Execution
```bash
# Add a new car
python scripts/add_model.py

# Search your collection
python scripts/search_model.py

# View statistics
python scripts/statistics.py

# Add custom fields
python scripts/add_field.py
```

### Option 3: Platform-Specific Launchers
```bash
# Windows
.\run.bat

# Linux/Mac
./run.sh
```

## 📖 Usage Guide

### Adding New Models

1. **Run the add script**:
   ```bash
   python scripts/add_model.py
   ```

2. **Enter model name**:
   - Type the full name: `Ford Mustang GT`
   - Use shortcuts: `Ford Mustang GT#11` (auto-selects series)

3. **Select series** (if not using shortcut):
   - Choose main category (1-4)
   - Choose sub-series (1-N)

4. **Continue adding** or type `exit` to finish

### Searching Your Collection

1. **Run the search script**:
   ```bash
   python scripts/search_model.py
   ```

2. **Enter search terms**:
   - Brand names: `Ford`, `Porsche`, `BMW`
   - Model names: `Mustang`, `911`, `M3`
   - Partial matches supported

3. **View results** with serial numbers and series info

### Viewing Statistics

1. **Run the statistics script**:
   ```bash
   python scripts/statistics.py
   ```

2. **Get comprehensive insights**:
   - Total collection count
   - Series breakdown with percentages
   - Most/least popular series
   - Collection diversity metrics
   - Recent additions
   - Milestone progress
   - Visual distribution charts

## 🔧 Scripts Overview

### `add_model.py`
- **Purpose**: Add new Hot Wheels cars to your collection
- **Features**: 
  - Automatic serial numbering
  - Series selection with shortcuts
  - Excel file auto-creation
  - Input validation

### `search_model.py`
- **Purpose**: Search and filter your collection
- **Features**:
  - Case-insensitive search
  - Partial matching
  - Results with full details
  - Multiple search sessions

### `statistics.py`
- **Purpose**: Comprehensive collection analytics
- **Features**:
  - Basic and detailed statistics
  - Visual charts and graphs
  - Milestone tracking
  - Recent additions display
  - Collection goals

### `add_field.py`
- **Purpose**: Extend database schema
- **Features**:
  - Add custom columns
  - Duplicate prevention
  - Excel file updates

## 🎮 Custom Run Commands

### Main Launcher (`main.py`)
```bash
python main.py
```
- Interactive menu system
- One-click access to all features
- Built-in help and system info
- Cross-platform compatibility

### Windows Batch Script (`run.bat`)
```bash
.\run.bat
```
- Double-click to run on Windows
- Quick command menu
- Native Windows integration
- Excel file auto-opening

### Linux/Mac Shell Script (`run.sh`)
```bash
./run.sh
```
- Unix-style commands
- Colored output
- Cross-platform file opening

### NPM-Style Scripts (if npm available)
```bash
npm run start    # Launch main menu
npm run add      # Add new model
npm run search   # Search models
npm run stats    # View statistics
npm run field    # Add new field
npm run excel    # Open Excel file
```

## 💾 Data Management

### Excel File Structure
- **Location**: `data/HW_list.xlsx`
- **Columns**: 
  - S.No (Serial Number)
  - Model Name
  - Series
  - [Custom fields added via add_field.py]

### Data Backup
- **Automatic**: Excel file is saved after each operation
- **Manual**: Copy `data/HW_list.xlsx` to backup location
- **Version Control**: Consider adding to Git (exclude large Excel files)

### File Organization
- **Scripts**: All Python files in `scripts/` folder
- **Data**: Excel file in `data/` folder
- **Launchers**: Main scripts in root directory

## 📊 Statistics & Analytics

### Collection Overview
- **Total Cars**: Complete count of your collection
- **Series Breakdown**: Count and percentage for each series
- **Diversity Metrics**: How varied your collection is

### Detailed Analysis
- **Most Popular Series**: Your most collected series
- **Least Popular Series**: Rare series in your collection
- **Model Name Insights**: Common words and patterns
- **Average Name Length**: Statistical analysis of naming

### Visual Charts
- **ASCII Bar Charts**: Text-based distribution visualization
- **Series Comparison**: Easy visual comparison of series sizes
- **Progress Tracking**: Visual representation of collection growth

### Milestone Tracking
- **Goal Setting**: Automatic milestone detection (10, 25, 50, 100, 250, 500, 1000)
- **Progress Display**: Percentage complete toward next milestone
- **Motivation**: Clear indication of cars needed for next goal

## 📚 Documentation

### Additional Guides
- **[Quick Start Guide](docs/QUICK_START.md)** - Fastest ways to get started with npm commands and batch files
- **[Web Application Guide](docs/README_WEB.md)** - Complete guide to the modern FastAPI web interface
- **[WARP Development Guide](docs/WARP.md)** - Technical documentation for developers and contributors

### Getting Help
- **Quick Start**: Use `docs/QUICK_START.md` for immediate setup
- **Web Interface**: Check `docs/README_WEB.md` for the modern web application
- **Development**: See `docs/WARP.md` for technical implementation details

## 🔧 Troubleshooting

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
- **Cause**: Missing openpyxl library
- **Solution**: Run `pip install openpyxl`

### File Path Issues
- **Scripts**: Use `python scripts/script_name.py`
- **Data**: Excel file should be in `data/` folder
- **Working Directory**: Always run from project root

### Performance Tips
- **Large Collections**: Statistics may take longer with 1000+ cars
- **Excel File Size**: Consider archiving old data if file becomes too large
- **Memory Usage**: Close Excel before running scripts for better performance

## 🤝 Contributing

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

### Feature Requests
- Open an issue with detailed description
- Include use cases and examples
- Consider backward compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Future Enhancements

### Planned Features
- **Web Interface**: Browser-based management
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

## 🚗 Happy Collecting!

DieCastTracker makes managing your Hot Wheels collection fun and organized. Whether you're a casual collector or a serious enthusiast, this tool helps you keep track of your cars, analyze your collection, and set goals for the future.

**Start your collection journey today!**

```bash
python main.py
```

---

*Made with ❤️ for Hot Wheels collectors worldwide*