const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/admin/page.js');
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes('import BulkDiscountsAdmin')) {
    content = content.replace(
        'import AdminDashboardLayout from "./components/AdminDashboardLayout";',
        'import AdminDashboardLayout from "./components/AdminDashboardLayout";\nimport BulkDiscountsAdmin from "./components/BulkDiscountsAdmin";'
    );
}

// Add tab rendering
if (!content.includes('{activeTab === "bulk_discounts" && (')) {
    const tabRender = `
                    {activeTab === "bulk_discounts" && (
                        <BulkDiscountsAdmin />
                    )}
`;
    // Find the end of the Layout block
    content = content.replace(
        '                    {activeTab === "mobile_banners" && <MobileBannersAdmin theme={theme} t={t} />}',
        `                    {activeTab === "mobile_banners" && <MobileBannersAdmin theme={theme} t={t} />}\n${tabRender}`
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated page.js');
