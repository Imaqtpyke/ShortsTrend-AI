const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
    'className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24"',
    'className="flex flex-col gap-6 items-start scroll-mt-24 w-full"'
);

content = content.replace(
    'className="hidden lg:block lg:col-span-3 space-y-2 self-start sticky top-24"',
    'className={cn("hidden lg:flex w-full overflow-x-auto gap-2 pb-2 custom-scrollbar sticky top-16 z-40 transition-colors pt-4 -mt-4", state.isDarkMode ? "bg-[#0a0a0a]" : "bg-[#E4E3E0]")}'
);

content = content.replace(
    '"lg:col-span-9 border transition-all duration-300 p-4 md:p-8 min-h-[600px]"',
    '"w-full border transition-all duration-300 p-4 md:p-8 min-h-[600px]"'
);

fs.writeFileSync('src/App.tsx', content);
console.log("Replaced");
