let importModalOpenCallback: (() => void) | null = null
let disclaimerModalCallback: (() => void) | null = null

export function setImportModalCallback(callback: () => void) {
  importModalOpenCallback = callback
}

export function openImportModal() {
  if (importModalOpenCallback) {
    importModalOpenCallback()
  }
}

export function setDisclaimerModalCallback(callback: () => void) {
  disclaimerModalCallback = callback
}

export function openDisclaimerModal() {
  if (disclaimerModalCallback) {
    disclaimerModalCallback()
  }
}

