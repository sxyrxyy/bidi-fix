// Constants
const MAX_LENGTH = 10000;
const SENTENCE_TERMINATORS = /[.!?؟…]+/g;
const RTL_SCRIPTS = /\p{Script=Hebrew}|\p{Script=Arabic}/u;
const LTR_SCRIPTS = /\p{Script=Latin}|\p{Script=Cyrillic}/u;
const URL_PATTERN = /https?:\/\/[^\s]+/g;
const CODE_PATTERN = /`[^`]+`/g;

// Unicode marks
const LRM = '\u200E'; // Left-to-right mark
const RLM = '\u200F'; // Right-to-left mark
const FSI = '\u2068'; // First strong isolate
const PDI = '\u2069'; // Pop directional isolate

// DOM Elements
const inputText = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
const fixButton = document.getElementById('fixButton');
const resetButton = document.getElementById('resetButton');
const plainText = document.getElementById('plainText');
const htmlText = document.getElementById('htmlText');
const plainTab = document.getElementById('plainTab');
const htmlTab = document.getElementById('htmlTab');
const plainOutput = document.getElementById('plainOutput');
const htmlOutput = document.getElementById('htmlOutput');
const toast = document.getElementById('toast');
const copyButtons = document.querySelectorAll('.copy-button');

// State
let currentTab = 'plain';

// Event Listeners
inputText.addEventListener('input', updateCharCount);
fixButton.addEventListener('click', processText);
resetButton.addEventListener('click', resetAll);
plainTab.addEventListener('click', () => switchTab('plain'));
htmlTab.addEventListener('click', () => switchTab('html'));
document.addEventListener('keydown', handleKeyboardShortcuts);
copyButtons.forEach(button => {
    button.addEventListener('click', () => copyToClipboard(button.dataset.target));
});

// Functions
function updateCharCount() {
    // Count Unicode characters properly
    const count = [...inputText.value].length;
    charCount.textContent = count;
    charCount.style.color = count > MAX_LENGTH ? 'red' : '';
}

function resetAll() {
    inputText.value = '';
    plainText.value = '';
    htmlText.value = '';
    updateCharCount();
    inputText.focus();
}

function switchTab(tab) {
    currentTab = tab;
    const isPlain = tab === 'plain';
    
    plainTab.setAttribute('aria-selected', isPlain);
    htmlTab.setAttribute('aria-selected', !isPlain);
    
    plainOutput.hidden = !isPlain;
    htmlOutput.hidden = isPlain;
}

function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    setTimeout(() => {
        toast.hidden = true;
    }, 3000);
}

async function copyToClipboard(targetId) {
    const text = document.getElementById(targetId).value;
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
    } catch (err) {
        showToast('Failed to copy. Please try again.');
        console.error('Copy failed:', err);
    }
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to fix
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        processText();
    }
}

function getTextDirection(text) {
    if (RTL_SCRIPTS.test(text)) return 'rtl';
    if (LTR_SCRIPTS.test(text)) return 'ltr';
    // Preserve direction of URLs and code blocks
    if (URL_PATTERN.test(text) || CODE_PATTERN.test(text)) return 'ltr';
    return 'neutral';
}

function getBaseDirection(text) {
    // Check for URLs and code blocks first
    if (URL_PATTERN.test(text) || CODE_PATTERN.test(text)) return 'ltr';
    
    for (const char of text) {
        if (RTL_SCRIPTS.test(char)) return 'rtl';
        if (LTR_SCRIPTS.test(char)) return 'ltr';
    }
    return 'ltr'; // default to LTR
}

function processText() {
    const input = inputText.value.trim();
    if (!input) {
        showToast('Please enter some text to fix');
        return;
    }

    if (input.length > MAX_LENGTH) {
        showToast(`Text is too long (max ${MAX_LENGTH} characters)`);
        return;
    }

    try {
        // Preserve URLs and code blocks
        const preserved = new Map();
        let preservedIndex = 0;
        
        // Store URLs
        input.replace(URL_PATTERN, (url) => {
            const placeholder = `__URL${preservedIndex}__`;
            preserved.set(placeholder, url);
            preservedIndex++;
            return placeholder;
        });
        
        // Store code blocks
        input.replace(CODE_PATTERN, (code) => {
            const placeholder = `__CODE${preservedIndex}__`;
            preserved.set(placeholder, code);
            preservedIndex++;
            return placeholder;
        });

        // Split into sentences
        const sentences = input.split(SENTENCE_TERMINATORS);
        const terminators = input.match(SENTENCE_TERMINATORS) || [];
        
        let plainResult = '';
        let htmlResult = '';
        
        sentences.forEach((sentence, i) => {
            if (!sentence) return;
            
            // Restore preserved content
            let processedSentence = sentence;
            preserved.forEach((value, key) => {
                processedSentence = processedSentence.replace(key, value);
            });
            
            const runs = [];
            let currentRun = { text: '', direction: 'neutral' };
            
            // Split into direction runs, preserving URLs and code blocks
            for (let j = 0; j < processedSentence.length; j++) {
                const char = processedSentence[j];
                const nextChar = processedSentence[j + 1];
                
                // Check for URL or code block start
                if (char === 'h' && processedSentence.slice(j).match(/^https?:\/\//)) {
                    if (currentRun.text) runs.push(currentRun);
                    const urlMatch = processedSentence.slice(j).match(URL_PATTERN)[0];
                    runs.push({ text: urlMatch, direction: 'ltr' });
                    j += urlMatch.length - 1;
                    currentRun = { text: '', direction: 'neutral' };
                    continue;
                }
                
                if (char === '`' && nextChar) {
                    if (currentRun.text) runs.push(currentRun);
                    const codeEnd = processedSentence.indexOf('`', j + 1);
                    if (codeEnd !== -1) {
                        const codeBlock = processedSentence.slice(j, codeEnd + 1);
                        runs.push({ text: codeBlock, direction: 'ltr' });
                        j = codeEnd;
                        currentRun = { text: '', direction: 'neutral' };
                        continue;
                    }
                }
                
                const charDir = getTextDirection(char);
                if (charDir !== currentRun.direction) {
                    if (currentRun.text) runs.push(currentRun);
                    currentRun = { text: char, direction: charDir };
                } else {
                    currentRun.text += char;
                }
            }
            if (currentRun.text) runs.push(currentRun);
            
            // Determine base direction for this sentence
            const baseDir = getBaseDirection(processedSentence);
            let prevDir = baseDir;
            let firstRun = true;
            let plainSentence = '';
            let htmlSentence = '';
            
            runs.forEach(run => {
                if (run.direction === 'neutral') {
                    plainSentence += run.text;
                    htmlSentence += run.text;
                } else {
                    // Insert mark if direction changes from previous run (not first run)
                    if (!firstRun && run.direction !== prevDir) {
                        plainSentence += (run.direction === 'rtl' ? RLM : LRM);
                    }
                    // For the very first run, only insert mark if it differs from base
                    if (firstRun && run.direction !== baseDir) {
                        plainSentence += (run.direction === 'rtl' ? RLM : LRM);
                    }
                    plainSentence += run.text;
                    // Only wrap in <span dir> if direction differs from base
                    if (run.direction !== baseDir) {
                        htmlSentence += `<span dir="${run.direction}">${run.text}</span>`;
                    } else {
                        htmlSentence += run.text;
                    }
                    prevDir = run.direction;
                }
                firstRun = false;
            });
            
            // Add sentence to results
            plainResult += plainSentence + (terminators[i] || '');
            htmlResult += htmlSentence + (terminators[i] || '');
        });
        
        // Update outputs
        plainText.value = plainResult;
        htmlText.value = htmlResult;
        
        // Switch to plain text tab if not already there
        if (currentTab !== 'plain') {
            switchTab('plain');
        }
        
    } catch (err) {
        console.error('Processing failed:', err);
        showToast('Failed to process text. Please try again.');
    }
}

// Initialize
updateCharCount(); 