let elements = [];
let customHtmlCss = '';
let customReactCss = '';
let currentElementType = '';
let contextMenuVisible = false;
let contextMenuElementIndex = -1;
let isEditing = false; // Флаг для режима редактирования
let editingIndex = -1; // Индекс редактируемого элемента

function showStyleEditor(type, index = -1) {
    currentElementType = type;
    const modal = document.getElementById('style-editor-modal');
    const title = document.getElementById('style-editor-title');
    const submitButton = document.getElementById('style-editor-submit');
    const textInput = document.getElementById('element-text');

    if (index >= 0) {
        // Режим редактирования
        isEditing = true;
        editingIndex = index;
        const element = elements[index];
        title.textContent = 'Edit Element';
        submitButton.textContent = 'Save';

        // Заполняем поля текущими значениями элемента
        if (element.type === 'input') {
            textInput.value = element.placeholder || 'Enter text...';
        } else if (element.type === 'button') {
            textInput.value = element.text || 'Click me';
        }

        // Парсим стили элемента для заполнения полей
        const styles = element.customStyles ? element.customStyles.split(';').map(s => s.trim()).filter(s => s) : [];
        const styleMap = {};
        styles.forEach(style => {
            const [key, value] = style.split(':').map(s => s.trim());
            styleMap[key] = value;
        });

        document.getElementById('style-bg-color').value = styleMap['background-color'] || '#ffffff';
        document.getElementById('style-text-color').value = styleMap['color'] || '#000000';
        document.getElementById('style-font-size').value = styleMap['font-size'] ? parseInt(styleMap['font-size']) : '';
        document.getElementById('style-padding').value = styleMap['padding'] ? parseInt(styleMap['padding']) : '';
        document.getElementById('style-margin').value = styleMap['margin'] ? parseInt(styleMap['margin']) : '';
        document.getElementById('style-border-width').value = styleMap['border'] ? parseInt(styleMap['border']) : '';
        document.getElementById('style-border-color').value = styleMap['border'] ? (styleMap['border'].split(' ')[2] || '#000000') : '#000000';
    } else {
        // Режим добавления
        isEditing = false;
        editingIndex = -1;
        title.textContent = 'Add Element';
        submitButton.textContent = 'Add';
        textInput.value = type === 'input' ? 'Enter text...' : 'Click me';
        document.getElementById('style-bg-color').value = '#ffffff';
        document.getElementById('style-text-color').value = '#000000';
        document.getElementById('style-font-size').value = '';
        document.getElementById('style-padding').value = '';
        document.getElementById('style-margin').value = '';
        document.getElementById('style-border-width').value = '';
        document.getElementById('style-border-color').value = '#000000';
    }

    modal.style.display = 'flex';
    textInput.focus();
}

function cancelStyleEditor() {
    document.getElementById('style-editor-modal').style.display = 'none';
    isEditing = false;
    editingIndex = -1;
}

function submitStyleEditor() {
    const type = currentElementType;
    const text = document.getElementById('element-text').value || (type === 'input' ? 'Enter text...' : 'Click me');
    let element = { type, left: 0, top: 0 };

    if (type === 'input') {
        element.placeholder = text;
    } else if (type === 'button') {
        element.text = text;
    }

    const bgColor = document.getElementById('style-bg-color').value;
    const textColor = document.getElementById('style-text-color').value;
    const fontSize = document.getElementById('style-font-size').value;
    const padding = document.getElementById('style-padding').value;
    const margin = document.getElementById('style-margin').value;
    const borderWidth = document.getElementById('style-border-width').value;
    const borderColor = document.getElementById('style-border-color').value;

    let styles = [];
    if (bgColor !== '#ffffff') styles.push(`background-color: ${bgColor}`);
    if (textColor !== '#000000') styles.push(`color: ${textColor}`);
    if (fontSize) styles.push(`font-size: ${fontSize}px`);
    if (padding) styles.push(`padding: ${padding}px`);
    if (margin) styles.push(`margin: ${margin}px`);
    if (borderWidth) styles.push(`border: ${borderWidth}px solid ${borderColor}`);

    element.customStyles = styles.join('; ');

    if (isEditing && editingIndex >= 0) {
        // Режим редактирования: обновляем существующий элемент
        const oldElement = elements[editingIndex];
        element.left = oldElement.left; // Сохраняем координаты
        element.top = oldElement.top;
        elements[editingIndex] = element;
    } else {
        // Режим добавления: добавляем новый элемент
        elements.unshift(element);
    }

    document.getElementById('style-editor-modal').style.display = 'none';
    isEditing = false;
    editingIndex = -1;
    updatePreview();
}

function updatePreview() {
    const preview = document.getElementById('form-preview');
    preview.innerHTML = '';

    elements.forEach((element, idx) => {
        const div = createElementDiv(element, idx);
        preview.appendChild(div);
    });

    applyCustomCss();
}

function createElementDiv(element, idx) {
    const div = document.createElement('div');
    div.className = 'element';
    div.draggable = true;
    div.id = `element-${idx}`;
    div.dataset.index = idx;

    div.style.left = `${element.left}px`;
    div.style.top = `${element.top}px`;

    div.oncontextmenu = (e) => {
        e.preventDefault();
        showContextMenu(e, idx);
    };
    div.ondragstart = (e) => drag(e, idx);
    div.ondragover = allowDrop;
    div.ondrop = (e) => drop(e, idx);

    if (element.type === 'input') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = element.placeholder;
        input.id = `${element.type}${idx}`;
        div.appendChild(input);
    } else if (element.type === 'button') {
        const button = document.createElement('button');
        button.textContent = element.text;
        button.id = `${element.type}${idx}`;
        div.appendChild(button);
    }

    return div;
}

function showContextMenu(event, index) {
    hideContextMenu();

    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    contextMenuElementIndex = index;
    contextMenuVisible = true;

    document.addEventListener('click', hideContextMenu);
}

function hideContextMenu() {
    if (contextMenuVisible) {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'none';
        contextMenuElementIndex = -1;
        contextMenuVisible = false;
        document.removeEventListener('click', hideContextMenu);
    }
}

function editElement() {
    if (contextMenuElementIndex >= 0 && contextMenuElementIndex < elements.length) {
        const element = elements[contextMenuElementIndex];
        showStyleEditor(element.type, contextMenuElementIndex);
        hideContextMenu();
    }
}

function deleteElement() {
    if (contextMenuElementIndex >= 0 && contextMenuElementIndex < elements.length) {
        elements.splice(contextMenuElementIndex, 1);
        updatePreview();
        hideContextMenu();
    }
}

function drag(event, index) {
    event.dataTransfer.setData('text/plain', index);
    const element = document.getElementById(`element-${index}`);
    event.dataTransfer.setData('text/offsetX', event.offsetX);
    event.dataTransfer.setData('text/offsetY', event.offsetY);
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event, dropIndex) {
    event.preventDefault();
    const draggedIndex = parseInt(event.dataTransfer.getData('text/plain'));
    const draggedElement = elements[draggedIndex];
    const offsetX = parseInt(event.dataTransfer.getData('text/offsetX'));
    const offsetY = parseInt(event.dataTransfer.getData('text/offsetY'));

    const rect = document.getElementById('form-preview').getBoundingClientRect();
    const newLeft = event.clientX - rect.left - offsetX;
    const newTop = event.clientY - rect.top - offsetY;

    draggedElement.left = Math.max(0, newLeft);
    draggedElement.top = Math.max(0, newTop);

    const dropTarget = event.target.closest('.element');
    if (dropTarget) {
        const targetIndex = parseInt(dropTarget.dataset.index);
        if (targetIndex !== draggedIndex) {
            const [movedElement] = elements.splice(draggedIndex, 1);
            elements.splice(targetIndex, 0, movedElement);
        }
    }

    updatePreview();
}

function applyCustomCss() {
    customHtmlCss = document.getElementById('css-output').value;
    customReactCss = document.getElementById('react-css-output').value;

    let previewCss = customReactCss || customHtmlCss || `body { font-family: Arial, sans-serif; }\n`;
    elements.forEach((element, idx) => {
        const elementId = `${element.type}${idx}`;
        if (element.customStyles) {
            previewCss += `#${elementId} {\n    ${element.customStyles};\n}\n`;
        } else {
            if (element.type === 'input') {
                previewCss += `#${elementId} {\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}\n`;
            } else if (element.type === 'button') {
                previewCss += `#${elementId} {\n    padding: 10px 20px;\n    margin: 10px;\n    background-color: #007BFF;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}\n#${elementId}:hover {\n    background-color: #0056b3;\n}\n`;
            }
        }
        previewCss += `#element-${idx} {\n    position: absolute;\n    left: ${element.left}px;\n    top: ${element.top}px;\n    width: fit-content;\n}\n`;
    });

    let styleElement = document.getElementById('preview-style');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'preview-style';
        document.head.appendChild(styleElement);
    }
    styleElement.textContent = previewCss;
}

function generateCodeLocally() {
    let htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Generated Form</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .form-container {
            position: relative;
            min-height: 300px;
            border: 1px solid #ccc;
            padding: 20px;
            overflow: auto;
        }
    </style>
</head>
<body>
    <div class="form-container">
`;
    let cssCode = `body {
    font-family: Arial, sans-serif;
}
`;

    elements.forEach((element, idx) => {
        const elementId = `${element.type}${idx}`;
        htmlCode += `        <div style="position: absolute; left: ${element.left}px; top: ${element.top}px;">\n`;
        if (element.type === 'input') {
            htmlCode += `            <input type="text" placeholder="${element.placeholder}" id="${elementId}">\n`;
        } else if (element.type === 'button') {
            htmlCode += `            <button id="${elementId}">${element.text}</button>\n`;
        }
        htmlCode += `        </div>\n`;

        if (element.customStyles) {
            cssCode += `#${elementId} {\n    ${element.customStyles};\n}\n`;
        } else {
            if (element.type === 'input') {
                cssCode += `#${elementId} {\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}\n`;
            } else if (element.type === 'button') {
                cssCode += `#${elementId} {\n    padding: 10px 20px;\n    margin: 10px;\n    background-color: #007BFF;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}\n#${elementId}:hover {\n    background-color: #0056b3;\n}\n`;
            }
        }
    });

    htmlCode += `    </div>
</body>
</html>`;

    document.getElementById('html-output').value = htmlCode;
    document.getElementById('css-output').value = cssCode;
    customHtmlCss = cssCode;
    applyCustomCss();
}

function generateReactCode() {
    let reactCode = `import React from 'react';
import './styles.css';

const GeneratedForm = () => {
    return (
        <div style={{ position: 'relative', minHeight: '300px', border: '1px solid #ccc', padding: '20px', overflow: 'auto' }}>
`;
    let cssCode = `body {
    font-family: Arial, sans-serif;
}
`;

    elements.forEach((element, idx) => {
        const elementId = `${element.type}${idx}`;
        reactCode += `            <div style={{ position: 'absolute', left: '${element.left}px', top: '${element.top}px' }}>\n`;
        if (element.type === 'input') {
            reactCode += `                <input
                    type="text"
                    placeholder="${element.placeholder}"
                    id="${elementId}"
                />\n`;
        } else if (element.type === 'button') {
            reactCode += `                <button
                    id="${elementId}"
                >
                    ${element.text}
                </button>\n`;
        }
        reactCode += `            </div>\n`;

        if (element.customStyles) {
            cssCode += `#${elementId} {\n    ${element.customStyles};\n}\n`;
        } else {
            if (element.type === 'input') {
                cssCode += `#${elementId} {\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}\n`;
            } else if (element.type === 'button') {
                cssCode += `#${elementId} {\n    padding: 10px 20px;\n    margin: 10px;\n    background-color: #007BFF;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}\n#${elementId}:hover {\n    background-color: #0056b3;\n}\n`;
            }
        }
    });

    reactCode += `        </div>
    );
};

export default GeneratedForm;`;

    document.getElementById('html-output').value = '';
    document.getElementById('css-output').value = '';
    document.getElementById('react-output').value = reactCode;
    document.getElementById('react-css-output').value = cssCode;
    customReactCss = cssCode;
    applyCustomCss();
}

async function saveForm() {
    const formName = document.getElementById('form-name').value || 'Untitled Form';
    const htmlOutput = document.getElementById('html-output').value;
    const cssOutput = document.getElementById('css-output').value;
    const reactOutput = document.getElementById('react-output').value;
    const reactCssOutput = document.getElementById('react-css-output').value;

    const response = await fetch('/projects/save_form/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            name: formName,
            html_code: htmlOutput,
            css_code: cssOutput,
            react_code: reactOutput,
            react_css_code: reactCssOutput,
            elements: elements
        })
    });

    const result = await response.json();
    if (result.status === 'success') {
        alert('Form saved successfully!');
    } else {
        alert('Error saving form: ' + result.error);
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}