(function() {
    top.vscode = acquireVsCodeApi();

    top.templateUserInput = {
        data: {
            concepts: [],
            existingConcepts: [],
            templateName: ''
        },

        handleConfirm() {
            top.vscode.postMessage('confirm');
        },

        handleCancel() {
            top.vscode.postMessage('cancel');
        },

        render() {
            const { concepts, existingConcepts, templateName } = this.data;

            const conceptArr = Array.isArray(concepts) ? concepts : [];
            const conceptsHTML = conceptArr
                .map(
                    (name) => `
                        <li class="user-input-variable-name">${name}</li>
                        `
                )
                .join('');

            const conceptPanelHTML =
                conceptArr.length > 0
                    ? `
                    <div class="user-input-panel">
                        <h3 class="user-input-panel-title">About to generate concepts:</h3>
                        <div class="user-input-panel-content">
                            <ul class="user-input-variables">
                                ${conceptsHTML}
                            </ul>
                        </div>
                    </div>
                    `
                    : '';

            const existingConceptArr = Array.isArray(existingConcepts) ? existingConcepts : [];
            const existingConceptsHTML = existingConceptArr
                .map(
                    (name) => `
                        <li class="user-input-variable-name">${name}</li>
                        `
                )
                .join('');     
                
            const existingConceptPanelHTML = 
                existingConceptArr.length > 0
                    ? `
                    <div class="user-input-panel">
                        <h3 class="user-input-panel-title">Concept already exists:</h3>
                        <div class="user-input-panel-content">
                            <ul class="user-input-variables">
                                ${existingConceptsHTML}
                            </ul>
                        </div>
                    </div>
                `
                    : '';                    

            const confirmButtonHTML = conceptArr.length > 0
            ? '<button class="user-input-confirm-btn">Confirm</button>' : '';

            const rootEl = document.getElementById('user-input-root');
            rootEl.innerHTML = `
                <h1 class="user-input-header">${templateName}</h1>
                
                <div class="user-input-content">
                    ${conceptPanelHTML}
                    ${existingConceptPanelHTML}
                </div>

                <div class="user-input-submit-btns">
                    ${confirmButtonHTML}
                    <button class="user-input-cancel-btn">Cancel</button>
                </div>`;
            
            if (conceptArr.length > 0) {
                const confirmBtnEl = document.querySelector('.user-input-confirm-btn');
                confirmBtnEl.addEventListener('click', this.handleConfirm.bind(this));
            }

            const cancelBtnEl = document.querySelector('.user-input-cancel-btn');
            cancelBtnEl.addEventListener('click', this.handleCancel.bind(this));

            rootEl.ownerDocument.addEventListener('keydown', e => {
                if (e.key.toLowerCase() === 'enter') {
                    this.handleConfirm();
                }
                if (e.key.toLowerCase() === 'escape') {
                    this.handleCancel();
                }
            });
        },

        start(userInputRequest) {
            const { concepts, existingConcepts, templateName } = userInputRequest;
            const { data } = this;

            data.templateName = templateName;
            data.concepts = concepts || [];
            data.existingConcepts = existingConcepts || [];

            this.render();
        },
    };
})();
