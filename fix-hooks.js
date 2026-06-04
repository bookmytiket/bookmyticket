const fs = require('fs');
const files = [
  'app/admin/components/OrganizerReportsAdmin.jsx',
  'app/admin/components/UserRegistrationAnalytics.jsx',
  'app/admin/components/AdminEventPublishing.jsx',
  'app/admin/components/ProfessionalServicesAdmin.jsx',
  'app/admin/components/DirectOnboardingAdmin.jsx',
  'app/admin/components/AdminRevenueCommissionDashboard.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find the useEffect block
  const match = content.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[.*?\]\);/);
  if (match) {
    const useEffectStr = match[0];
    content = content.replace(useEffectStr, '');
    
    // find the end of the fetch function
    const fetchFunc = content.match(/const fetch.*? = async \(\) => \{[\s\S]*?\};/);
    if (fetchFunc) {
      content = content.replace(fetchFunc[0], fetchFunc[0] + '\n\n    ' + useEffectStr);
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
    } else {
        const fetchFunc2 = content.match(/const fetch.*? = async \(\) => \{[\s\S]*?\}\n\s*?\n/);
        if(fetchFunc2) {
             content = content.replace(fetchFunc2[0], fetchFunc2[0] + '    ' + useEffectStr + '\n\n');
             fs.writeFileSync(file, content);
             console.log('Fixed', file);
        }
    }
  }
});
