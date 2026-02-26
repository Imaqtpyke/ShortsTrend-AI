const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const startMatch = ") : activeTab === 'trends' && state.analysis ? (";
const startIdx = content.indexOf(startMatch);

// Find the last null} that belongs to AnimatePresence
const endMatch = ") : null}";
let endIdx = content.indexOf(endMatch, startIdx);
while (content.indexOf(endMatch, endIdx + 1) !== -1 && content.indexOf(endMatch, endIdx + 1) < content.indexOf('</AnimatePresence>')) {
    endIdx = content.indexOf(endMatch, endIdx + 1);
}

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `) : activeTab === 'trends' && state.analysis ? (
                  <TrendsView appState={appState} />
                ) : activeTab === 'generator' ? (
                  <GeneratorView appState={appState} />
                ) : activeTab === 'critique' ? (
                  <CritiqueView appState={appState} />
                ) : activeTab === 'workflow' ? (
                  <WorkflowView appState={appState} />
                ) : activeTab === 'history' ? (
                  <HistoryView appState={appState} />
                ) : null}`;

    // Add imports at the top
    const importReplacement = `import { useAppState } from './hooks/useAppState';
import { TrendsView } from './components/views/TrendsView';
import { GeneratorView } from './components/views/GeneratorView';
import { CritiqueView } from './components/views/CritiqueView';
import { WorkflowView } from './components/views/WorkflowView';
import { HistoryView } from './components/views/HistoryView';`;

    let newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + endMatch.length);
    newContent = newContent.replace("import { useAppState } from './hooks/useAppState';", importReplacement);

    fs.writeFileSync('src/App.tsx', newContent);
    console.log('Replacement successful');
} else {
    console.log('Indices not found:', startIdx, endIdx);
}
