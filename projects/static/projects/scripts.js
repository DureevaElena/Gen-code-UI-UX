let elements = [];
let customHtmlCss = '';
let customReactCss = '';
let currentElementType = '';
let contextMenuVisible = false;
let contextMenuElementIndex = -1;
let isEditing = false;
let editingIndex = -1;
let resizingElementIndex = -1;
let isResizing = false;

async function uploadImage(file) {
    console.log('uploadImage called');
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/projects/upload_image/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookies('csrftoken')
            },
            body: formData
        });
        const result = await response.json();
        if (result.status === 'success') {
            console.log('Image uploaded successfully:', result.file_path);
            return result.file_path;
        } else {
            console.error('Image upload error:', result.error);
            alert('Ошибка при загрузке изображения: ' + result.error);
            return null;
        }
    } catch (error) {
        console.error('Image upload failed:', error);
        alert('Ошибка при загрузке изображения: ' + error);
        return null;
    }
}

function showStyleEditor(type, index = -1) {
    console.log('showStyleEditor called with type:', type, 'index:', index);
    currentElementType = type;
    const modal = document.getElementById('style-editor-modal');
    const title = document.getElementById('style-editor-title');
    const submitButton = document.getElementById('style-editor-submit');
    const textInput = document.getElementById('element-text');
    const textLabel = document.getElementById('element-text-label');
    const textContainer = document.getElementById('element-text-container');
    const fileInput = document.getElementById('element-file');
    const fileContainer = document.getElementById('element-file-container');

    textContainer.style.display = (type === 'input' || type === 'button' || type === 'heading' || type === 'line' || type === 'rectangle' || type === 'image') ? 'block' : 'none';
    fileContainer.style.display = (type === 'image') ? 'block' : 'none';

    if (type === 'line') {
        textLabel.textContent = 'Длина (px):';
        textInput.type = 'number';
        textInput.placeholder = 'e.g., 100';
    } else if (type === 'heading') {
        textLabel.textContent = 'Текст заголовка:';
        textInput.type = 'text';
        textInput.placeholder = 'e.g., Заголовок';
    } else if (type === 'rectangle' || type === 'image') {
        textLabel.textContent = 'Ширина (px):';
        textInput.type = 'number';
        textInput.placeholder = 'e.g., 100';
    } else {
        textLabel.textContent = type === 'input' ? 'Placeholder:' : 'Текст кнопки:';
        textInput.type = 'text';
        textInput.placeholder = type === 'input' ? 'Введите текст...' : 'Нажми меня';
    }

    if (index >= 0) {
        isEditing = true;
        editingIndex = index;
        const element = elements[index];
        title.textContent = 'Редактировать элемент';
        submitButton.textContent = 'Сохранить';

        if (element.type === 'input') {
            textInput.value = element.placeholder || 'Введите текст...';
        } else if (element.type === 'button') {
            textInput.value = element.text || 'Нажми меня';
        } else if (element.type === 'line') {
            textInput.value = element.length || '100';
        } else if (element.type === 'heading') {
            textInput.value = element.text || 'Заголовок';
        } else if (element.type === 'rectangle' || element.type === 'image') {
            textInput.value = element.width || '100';
        }

        fileInput.value = ''; // Сбрасываем input file

        const styles = element.customStyles ? element.customStyles.split(';').map(s => s.trim()).filter(s => s) : [];
        const styleMap = {};
        styles.forEach(style => {
            const [key, value] = style.split(':').map(s => s.trim());
            styleMap[key] = value;
        });

        document.getElementById('style-bg-color').value = styleMap['background-color'] || (type === 'line' ? '#000000' : '#cccccc');
        document.getElementById('style-text-color').value = styleMap['color'] || '#000000';
        document.getElementById('style-font-size').value = styleMap['font-size'] ? parseInt(styleMap['font-size']) : '';
        document.getElementById('style-padding').value = styleMap['padding'] ? parseInt(styleMap['padding']) : '';
        document.getElementById('style-margin').value = styleMap['margin'] ? parseInt(styleMap['margin']) : '';
        document.getElementById('style-border-width').value = styleMap['border'] ? parseInt(styleMap['border']) : '';
        document.getElementById('style-border-color').value = styleMap['border'] ? (styleMap['border'].split(' ')[2] || '#000000') : '#000000';
        document.getElementById('style-border-radius').value = styleMap['border-radius'] ? parseInt(styleMap['border-radius']) : '';
        document.getElementById('style-width').value = styleMap['width'] ? parseInt(styleMap['width']) : (element.type === 'rectangle' || element.type === 'image' ? element.width : '');
        document.getElementById('style-height').value = styleMap['height'] ? parseInt(styleMap['height']) : (element.type === 'rectangle' || element.type === 'image' ? element.height : '');
        document.getElementById('style-rotate').value = styleMap['transform'] ? parseInt(styleMap['transform'].match(/rotate\((\d+)deg\)/)?.[1] || 0) : '';
    } else {
        isEditing = false;
        editingIndex = -1;
        title.textContent = 'Добавить элемент';
        submitButton.textContent = 'Добавить';
        textInput.value = type === 'input' ? 'Введите текст...' : type === 'button' ? 'Нажми меня' : type === 'line' ? '100' : type === 'heading' ? 'Заголовок' : type === 'rectangle' ? '100' : type === 'image' ? '100' : '';
        fileInput.value = '';
        document.getElementById('style-bg-color').value = type === 'line' ? '#000000' : '#cccccc';
        document.getElementById('style-text-color').value = '#000000';
        document.getElementById('style-font-size').value = type === 'heading' ? '24' : '';
        document.getElementById('style-padding').value = '';
        document.getElementById('style-margin').value = '';
        document.getElementById('style-border-width').value = '';
        document.getElementById('style-border-color').value = '#000000';
        document.getElementById('style-border-radius').value = '';
        document.getElementById('style-width').value = type === 'rectangle' || type === 'image' ? '100' : '';
        document.getElementById('style-height').value = type === 'rectangle' || type === 'image' ? '50' : '';
        document.getElementById('style-rotate').value = '';
    }

    modal.style.display = 'flex';
    textInput.focus();
}

function cancelStyleEditor() {
    console.log('cancelStyleEditor called');
    document.getElementById('style-editor-modal').style.display = 'none';
    isEditing = false;
    editingIndex = -1;
}

async function submitStyleEditor() {
    console.log('submitStyleEditor called, isEditing:', isEditing, 'editingIndex:', editingIndex);
    const type = currentElementType;
    const text = document.getElementById('element-text').value || (type === 'input' ? 'Введите текст...' : type === 'button' ? 'Нажми меня' : type === 'line' ? '100' : type === 'heading' ? 'Заголовок' : type === 'rectangle' ? '100' : type === 'image' ? '100' : '');
    let element = { type, left: 0, top: 0 };

    if (type === 'image') {
        const fileInput = document.getElementById('element-file');
        let filePath = isEditing && editingIndex >= 0 ? elements[editingIndex].file_path : null;

        if (fileInput.files.length > 0) {
            filePath = await uploadImage(fileInput.files[0]);
            if (!filePath) {
                return;
            }
        } else if (!isEditing) {
            alert('Пожалуйста, выберите изображение.');
            return;
        }

        element.file_path = filePath;
        element.width = parseInt(text) || 100;
        element.height = parseInt(document.getElementById('style-height').value) || 50;
    } else if (type === 'input') {
        element.placeholder = text;
    } else if (type === 'button') {
        element.text = text;
    } else if (type === 'line') {
        element.length = parseInt(text) || 100;
    } else if (type === 'heading') {
        element.text = text;
    } else if (type === 'rectangle') {
        element.width = parseInt(text) || 100;
        element.height = parseInt(document.getElementById('style-height').value) || 50;
    }

    const bgColor = document.getElementById('style-bg-color').value;
    const textColor = document.getElementById('style-text-color').value;
    const fontSize = document.getElementById('style-font-size').value;
    const padding = document.getElementById('style-padding').value;
    const margin = document.getElementById('style-margin').value;
    const borderWidth = document.getElementById('style-border-width').value;
    const borderColor = document.getElementById('style-border-color').value;
    const borderRadius = document.getElementById('style-border-radius').value;
    const width = document.getElementById('style-width').value;
    const height = document.getElementById('style-height').value;
    const rotate = document.getElementById('style-rotate').value;

    let styles = [];
    if (bgColor !== (type === 'line' ? '#000000' : '#cccccc')) styles.push(`background-color: ${bgColor}`);
    if (textColor !== '#000000' && type !== 'line' && type !== 'rectangle' && type !== 'image') styles.push(`color: ${textColor}`);
    if (fontSize && type !== 'line' && type !== 'rectangle' && type !== 'image') styles.push(`font-size: ${fontSize}px`);
    if (padding) styles.push(`padding: ${padding}px`);
    if (margin) styles.push(`margin: ${margin}px`);
    if (borderWidth) styles.push(`border: ${borderWidth}px solid ${borderColor}`);
    if (borderRadius) styles.push(`border-radius: ${borderRadius}px`);
    if (width && type !== 'line') styles.push(`width: ${width}px`);
    if (height && type !== 'line') styles.push(`height: ${height}px`);
    if (rotate) styles.push(`transform: rotate(${rotate}deg)`);
    if (type === 'line' && element.length) styles.push(`width: ${element.length}px`);

    element.customStyles = styles.join('; ');

    if (isEditing && editingIndex >= 0) {
        const oldElement = elements[editingIndex];
        element.left = oldElement.left;
        element.top = oldElement.top;
        elements[editingIndex] = element;
    } else {
        elements.unshift(element);
    }

    document.getElementById('style-editor-modal').style.display = 'none';
    isEditing = false;
    editingIndex = -1;
    updatePreview();
}

function updatePreview() {
    console.log('updatePreview called, elements:', elements);
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
    div.dataset.indexId = idx;

    div.style.left = `${element.left}px`;
    div.style.top = `${element.top}px`;

    div.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Context menu triggered for element:', idx, 'with type:', element.type);
        showContextMenu('context-menu', e);
        contextMenuElementIndex = idx;
    };
    div.ondragstart = (e) => drag(e, idx);
    div.ondragover = allowDrop;
    div.ondrop = (e) => drop(e, idx);

    if (element.type === 'input') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = element.placeholder;
        input.id = `${element.type}${idx}`;
        if (element.customStyles) {
            input.style.cssText = element.customStyles;
        }
        div.appendChild(input);
    } else if (element.type === 'button') {
        const button = document.createElement('button');
        button.textContent = element.text;
        button.id = `${element.type}${idx}`;
        if (element.customStyles) {
            button.style.cssText = element.customStyles;
        }
        div.appendChild(button);
    } else if (element.type === 'line') {
        const hr = document.createElement('hr');
        hr.id = `${element.type}${idx}`;
        if (element.customStyles) {
            hr.style.cssText = element.customStyles;
        }
        const resizeHandleLeft = document.createElement('div');
        resizeHandleLeft.className = 'resize-handle resize-left';
        resizeHandleLeft.dataset.indexId = idx;
        resizeHandleLeft.draggable = true;
        resizeHandleLeft.ondragstart = (e) => startResize(e, idx, 'left');
        resizeHandleLeft.ondragover = allowDrop;
        resizeHandleLeft.ondrop = (e) => resize(e, idx, 'left');

        const resizeHandleRight = document.createElement('div');
        resizeHandleRight.className = 'resize-handle resize-right';
        resizeHandleRight.dataset.indexId = idx;
        resizeHandleRight.draggable = true;
        resizeHandleRight.ondragstart = (e) => startResize(e, idx, 'right');
        resizeHandleRight.ondragover = allowDrop;
        resizeHandleRight.ondrop = (e) => resize(e, idx, 'right');

        div.appendChild(resizeHandleLeft);
        div.appendChild(hr);
        div.appendChild(resizeHandleRight);
    } else if (element.type === 'heading') {
        const heading = document.createElement('h1');
        heading.textContent = element.text;
        heading.id = `${element.type}${idx}`;
        if (element.customStyles) {
            heading.style.cssText = element.customStyles;
        }
        div.appendChild(heading);
    } else if (element.type === 'rectangle') {
        const shape = document.createElement('div');
        shape.id = `${element.type}${idx}`;
        if (element.customStyles) {
            shape.style.cssText = element.customStyles;
        }
        div.appendChild(shape);
    } else if (element.type === 'image') {
        const img = document.createElement('img');
        img.src = element.file_path;
        img.id = `${element.type}${idx}`;
        if (element.customStyles) {
            img.style.cssText = element.customStyles;
        }
        div.appendChild(img);
    }

    return div;
}

function startResize(event, indexId, side) {
    console.log('startResize called, indexId:', indexId, 'side:', side);
    event.dataTransfer.setData('text/plain', indexId);
    event.dataTransfer.setData('text/side', side);
    resizingElementIndex = indexId;
    isResizing = true;
}

function resize(event, indexId, side) {
    console.log('resize called, indexId:', indexId, 'side:', side);
    event.preventDefault();
    if (!isResizing || indexId !== resizingElementIndex) return;

    const element = elements[indexId];
    if (element.type !== 'line') return;

    const rect = document.getElementById('form-preview').getBoundingClientRect();
    const newX = event.clientX - rect.left;
    let newLength;

    if (side === 'left') {
        newLength = element.length + (element.left - newX);
        element.left = Math.max(0, newX);
    } else {
        newLength = newX - element.left;
    }

    element.length = Math.max(10, newLength);
    element.customStyles = element.customStyles.replace(/width:\s*\d+px/, `width:${element.length}px`) || `width: ${element.length}px`;
    updatePreview();
}

function stopResize() {
    console.log('stopResize called');
    isResizing = false;
    resizingElementIndex = -1;
}

function showContextMenu(id, event) {
    console.log('showContextMenu called with ID:', id, 'event:', event);
    hideContextMenu();

    const contextMenu = document.getElementById(id);
    if (!contextMenu) {
        console.error('Context menu not found:', id);
        return;
    }

    contextMenu.style.display = 'flex';
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    contextMenuVisible = true;

    document.addEventListener('mousedown', hideContextMenu);
}

function hideContextMenu(event) {
    if (contextMenuVisible) {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu && (!event || !contextMenu.contains(event.target))) {
            contextMenu.style.display = 'none';
            contextMenuElementIndex = -1;
            contextMenuVisible = false;
            document.removeEventListener('mousedown', hideContextMenu);
            console.log('Context menu hidden');
        }
    }
}

function editElement() {
    console.log('editElement called, contextMenuElementIndex:', contextMenuElementIndex);
    if (contextMenuElementIndex >= 0 && contextMenuElementIndex < elements.length) {
        const element = elements[contextMenuElementIndex];
        console.log('Editing element:', element);
        showStyleEditor(element.type, contextMenuElementIndex);
        hideContextMenu();
    } else {
        console.error('Invalid contextMenuElementIndex:', contextMenuElementIndex);
    }
}

function deleteElement() {
    console.log('deleteElement called, contextMenuElementIndex:', contextMenuElementIndex);
    if (contextMenuElementIndex >= 0 && contextMenuElementIndex < elements.length) {
        console.log('Deleting element:', elements[contextMenuElementIndex]);
        elements.splice(contextMenuElementIndex, 1);
        updatePreview();
        hideContextMenu();
    } else {
        console.error('Invalid contextMenuElementIndex:', contextMenuElementIndex);
    }
}

function drag(event, indexId) {
    console.log('drag called, indexId:', indexId);
    event.dataTransfer.setData('text/plain', indexId);
    const element = document.getElementById(`element-${indexId}`);
    event.dataTransfer.setData('text/offsetX', event.offsetX);
    event.dataTransfer.setData('text/offsetY', event.offsetY);
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event, dropIndexId) {
    console.log('drop called, dropIndexId:', dropIndexId);
    event.preventDefault();
    const draggedIndexId = parseInt(event.dataTransfer.getData('text/plain'));
    const draggedElement = elements[draggedIndexId];
    const offsetX = parseInt(event.dataTransfer.getData('text/offsetX'));
    const offsetY = parseInt(event.dataTransfer.getData('text/offsetY'));

    const rect = document.getElementById('form-preview').getBoundingClientRect();
    const newLeft = event.clientX - rect.left - offsetX;
    const newTop = event.clientY - rect.top - offsetY;

    draggedElement.left = Math.max(0, newLeft);
    draggedElement.top = Math.max(0, newTop);

    const dropTarget = event.target.closest('.element');
    if (dropTarget) {
        const targetIndex = parseInt(dropTarget.dataset.indexId);
        if (targetIndex !== draggedIndexId) {
            const [movedElement] = elements.splice(draggedIndexId, 1);
            elements.splice(targetIndex, 0, movedElement);
        }
    }

    updatePreview();
}

function applyCustomCss() {
    console.log('applyCustomCss called');
    customHtmlCss = document.getElementById('css-output').value;
    customReactCss = document.getElementById('react-css-textarea').value;

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
            } else if (element.type === 'line') {
                previewCss += `#${elementId} {\n    border: none;\n    border-top: 2px solid #000000;\n    margin: 0;\n    height: 0;\n    width: ${element.length || 100}px;\n}\n`;
            } else if (element.type === 'heading') {
                previewCss += `#${elementId} {\n    margin: 10px;\n    font-size: 24px;\n    font-weight: bold;\n}\n`;
            } else if (element.type === 'rectangle') {
                previewCss += `#${elementId} {\n    width: ${element.width || 100}px;\n    height: ${element.height || 50}px;\n    background-color: #cccccc;\n    margin: 10px;\n}\n`;
            } else if (element.type === 'image') {
                previewCss += `#${elementId} {\n    width: ${element.width || 100}px;\n    height: ${element.height || 50}px;\n    margin: 10px;\n    object-fit: contain;\n}\n`;
            }
        }
        previewCss += `#element-${idx} {\n    position: absolute;\n    left: ${element.left}px;\n    top: ${element.top}px;\n}\n`;
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
    console.log('generateCodeLocally called');
    let htmlCode = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Generated Form</title>\n    <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n   ';
    let cssCode = `body {\n    font-family: Arial, sans-serif;\n}\n`;

    elements.forEach((element, idx) => {
        const elementId = `${element.type}${idx}`;
        htmlCode += `        <div style="position: absolute; left: ${element.left}px; top: ${element.top}px;">\n`;
        if (element.type === 'input') {
            htmlCode += `            <input type="text" placeholder="${element.placeholder}" id="${elementId}">\n`;
        } else if (element.type === 'button') {
            htmlCode += `            <button id="${elementId}">${element.text}</button>\n`;
        } else if (element.type === 'line') {
            htmlCode += `            <hr id="${elementId}">\n`;
        } else if (element.type === 'heading') {
            htmlCode += `            <h1 id="${elementId}">${element.text}</h1>\n`;
        } else if (element.type === 'rectangle') {
            htmlCode += `            <div id="${elementId}"></div>\n`;
        } else if (element.type === 'image') {
            htmlCode += `            <img src="${element.file_path || 'https://via.placeholder.com/100x50'}" id="${elementId}" alt="Image">\n`;
        }
        htmlCode += '        </div>\n';

        if (element.customStyles) {
            cssCode += `#${elementId} {\n    ${element.customStyles};\n}\n`;
        } else {
            if (element.type === 'input') {
                cssCode += `#${elementId} {\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}\n`;
            } else if (element.type === 'button') {
                cssCode += `#${elementId} {\n    padding: 10px 20px;\n    margin: 10px;\n    background-color: #007BFF;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}\n#${elementId}:hover {\n    background-color: #0056b3;\n}\n`;
            } else if (element.type === 'line') {
                cssCode += `#${elementId} {\n    border: none;\n    border-top: 2px solid #000000;\n    margin: 0;\n    height: 0;\n    width: ${element.length || 100}px;\n}\n`;
            } else if (element.type === 'heading') {
                cssCode += `#${elementId} {\n    margin: 10px;\n    font-size: 24px;\n    font-weight: bold;\n}\n`;
            } else if (element.type === 'rectangle') {
                cssCode += `#${elementId} {\n    width: ${element.width || 100}px;\n    height: ${element.height || 50}px;\n    background-color: #cccccc;\n    margin: 10px;\n}\n`;
            } else if (element.type === 'image') {
                cssCode += `#${elementId} {\n    width: ${element.width || 100}px;\n    height: ${element.height || 50}px;\n    margin: 10px;\n    object-fit: contain;\n}\n`;
            }
        }
    });

    htmlCode += '    </div>\n</body>\n</html>\n';

    document.getElementById('html-output').value = htmlCode;
    document.getElementById('css-output').value = cssCode;
    customHtmlCss = cssCode;
    applyCustomCss();
}

function generateReactCode() {
    console.log('generateReactCode called');
    let reactCode = `import React from 'react';\n'import './styles.css';\n\nconst GeneratedForm = () => {\n    return (\n        <div style={{ position: 'relative' }}>\n`;
    let cssCode = `body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 0;\n}\n`;

    elements.forEach((element, idx) => {
        const elementId = `${element.type}${idx}`;
        reactCode += `            <div style={{ position: 'absolute', left: '${element.left}px', top: '${element.top}px' }}>\n`;
        if (element.type === 'input') {
            reactCode += `                <input\n                    type="text"\n                    placeholder="${element.placeholder}"\n                    id="${elementId}"\n                />\n`;
        } else if (element.type === 'button') {
            reactCode += `                <button\n                    id="${elementId}"\n                >\n                    ${element.text}\n                </button>\n`;
        } else if (element.type === 'line') {
            reactCode += `                <hr\n                    id="${elementId}"\n                />\n`;
        } else if (element.type === 'heading') {
            reactCode += `                <h1\n                    id="${elementId}"\n                >\n                    ${element.text}\n                </h1>\n`;
        } else if (element.type === 'rectangle') {
            reactCode += `                <div\n                    id="${elementId}"\n                ></div>\n`;
        } else if (element.type === 'image') {
            reactCode += `                <img\n                    src="${element.file_path || 'https://via.placeholder.com/100x50'}"\n                    id="${elementId}"\n                    alt="Image"\n                />\n`;
        }
        reactCode += `            </div>\n`;

        if (element.customStyles) {
            cssCode += `#${elementId} {\n    ${element.customStyles};\n}\n`;
        } else {
            if (element.type === 'input') {
                cssCode += `#${elementId} {\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}\n`;
            } else if (element.type === 'button') {
                cssCode += `#${elementId} {\n    padding: 10px 20px;\n    margin: 10px;\n    background-color: #007BFF;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}\n#${elementId}:hover {\n    background-color: #0056b3;\n}\n`;
            } else if (element.type === 'line') {
                cssCode += `#${elementId} {\n    border: none;\n    border-top: 2px solid #000000;\n    margin: 0;\n    height: 0;\n    width: ${element.length || 100}px;\n}\n`;
            } else if (element.type === 'heading') {
                cssCode += `#${elementId} {\n    margin: 10px;\n    font-size: 24px;\n    font-weight: bold;\n}\n`;
            } else if (element.type === 'rectangle') {
                cssCode += `#${elementId} {\n    width: ${element.width || 100}px;\n    height: ${element.height || 50}px;\n    background-color: #cccccc;\n    margin: 10px;\n}\n`;
            } else if (element.type === 'image') {
                cssCode += `#${elementId} {\n    width: ${element.width || 100}px;\n    height: ${element.height || 50}px;\n    margin: 10px;\n    object-fit: contain;\n}\n`;
            }
        }
    });

    reactCode += `        </div>\n    );\n};\n\nexport default GeneratedForm;\n`;

    document.getElementById('html-output').value = '';
    document.getElementById('css-output').value = '';
    document.getElementById('react-output').value = reactCode;
    document.getElementById('react-css-textarea').value = cssCode;
    customReactCss = cssCode;
    applyCustomCss();
}

async function saveForm() {
    console.log('saveForm called');
    const formName = document.getElementById('form-name').value || 'Untitled Form';
    const htmlOutput = document.getElementById('html-output').value;
    const cssOutput = document.getElementById('css-output').value;
    const reactOutput = document.getElementById('react-output').value;
    const reactCssCode = document.getElementById('react-css-textarea').value;

    const response = await fetch('/projects/save_form/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookies('csrftoken')
        },
        body: JSON.stringify({
            name: formName,
            html_code: htmlOutput,
            css_code: cssOutput,
            react_code: reactOutput,
            react_css_code: reactCssCode,
            elements: elements
        })
    });

    const result = await response.json();
    if (result.status === 'success') {
        console.log('Form saved successfully');
        alert('Форма успешно сохранена!');
    } else {
        console.error('Form save error:', result.error);
        alert('Ошибка при сохранении формы: ' + result.error);
    }
}

function getCookies(name) {
    console.log('getCookies called for name:', name);
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

document.addEventListener('dragend', stopResize);