let pending;
/** The original workbook importer uses SheetJS. Bundle it locally for consistent availability. */
export function loadSpreadsheet() {
    if (!pending)
        pending = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/vendor/xlsx.full.min.js';
            script.onload = () => resolve();
            script.onerror = () => {
                pending = undefined;
                script.remove();
                reject(new Error('Could not load the spreadsheet importer'));
            };
            document.head.append(script);
        });
    return pending;
}
