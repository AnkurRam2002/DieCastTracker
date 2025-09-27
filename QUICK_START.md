# 🚗 DieCast Tracker - Quick Start Guide

## ⚡ Fastest Ways to Start

### Option 1: npm Commands (Recommended)
```powershell
npm start          # 🌐 Start web application
npm run cli        # 💻 Start CLI interface
```

### Option 2: Double-click Batch File
Simply double-click `start.bat` and choose from the menu!

### Option 3: Direct Python
```powershell
python start_web.py    # 🌐 Web application
python main.py         # 💻 CLI interface
```

## 🎯 All Available Commands

### Web Application
```powershell
npm start              # Start web app (recommended)
npm run web            # Same as npm start
npm run dev            # Development mode with auto-reload
```

### CLI Operations
```powershell
npm run cli            # Interactive CLI menu
npm run add            # Add new models
npm run search         # Search existing models
npm run stats          # View collection statistics
npm run field          # Add new data fields
```

### File Operations
```powershell
npm run excel          # Open Excel file directly
```

### Development & Setup
```powershell
npm run install        # Install Python dependencies
npm run venv           # Create virtual environment
npm run activate       # Activate virtual environment
npm run freeze         # Update requirements.txt
npm run help           # Show all available commands
```

## 🌐 Web Application Features

After running `npm start`, access at **http://localhost:8000**

- **View Collection**: Browse all your die-cast models
- **Add Models**: Use cascading dropdowns (Series → Subseries)
- **Search**: Find models instantly
- **Scrollable Table**: Only the model list scrolls, headers stay fixed
- **Export**: Download your collection as CSV

## 💻 CLI Features

Run `npm run cli` for the interactive menu:

1. 🆕 Add New Model
2. 🔍 Search Models
3. 📊 View Statistics
4. ➕ Add New Field
5. 📁 Open Excel File
6. ❓ Help & Info
7. 🚪 Exit

## 📊 Data Structure

Your collection is stored in `data/HW_list.xlsx` with:
- **S.No**: Auto-incrementing serial number
- **Model Name**: Name of the die-cast model
- **Series**: Series/subseries name

## 🛠️ First Time Setup

1. **Install Dependencies**:
   ```powershell
   npm run install
   ```

2. **Start the App**:
   ```powershell
   npm start
   ```

3. **Add Your First Model**:
   - Click "Add Model" in the web interface, OR
   - Run `npm run add` for CLI

## 🔧 Troubleshooting

- **Port 8000 busy?** Change port in `start_web.py`
- **Excel file locked?** Close Excel before adding models
- **Dependencies missing?** Run `npm run install`

## 💡 Tips

- Use `npm start` for daily use (fastest startup)
- Use `npm run dev` when making changes to the code
- Double-click `start.bat` for a user-friendly menu
- The web interface is more user-friendly than CLI