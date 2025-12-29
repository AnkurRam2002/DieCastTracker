// Shared sidebar collapse functionality
function initSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    const mainContent = document.getElementById('main-content');
    
    if (!sidebar || !collapseBtn || !mainContent) return;
    
    // Load saved state from localStorage
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.remove('md:ml-64');
        mainContent.classList.add('md:ml-20');
    }
    
    // Toggle collapse on button click
    collapseBtn.addEventListener('click', () => {
        const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCurrentlyCollapsed) {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('md:ml-20');
            mainContent.classList.add('md:ml-64');
            localStorage.setItem('sidebarCollapsed', 'false');
        } else {
            sidebar.classList.add('collapsed');
            mainContent.classList.remove('md:ml-64');
            mainContent.classList.add('md:ml-20');
            localStorage.setItem('sidebarCollapsed', 'true');
        }
    });
}

// Initialize sidebar collapse when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initSidebarCollapse();
});

